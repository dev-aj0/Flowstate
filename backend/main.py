"""
Neuroadaptive Focus Coach - Python Backend
Handles Muse headset connection via LSL and streams EEG data to frontend via WebSocket
"""

import asyncio
import importlib
import importlib.util
import json
import os
import time
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Get allowed origins from environment or use defaults
# For network access, add your client IPs: ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")


def _load_pylsl():
    """Attempt to load pylsl without raising import-time exceptions."""

    spec = importlib.util.find_spec("pylsl")
    if spec is None:
        return None

    module = importlib.import_module("pylsl")
    return module


_pylsl_module = _load_pylsl()

if _pylsl_module is None:
    StreamInlet = None
    resolve_stream = None
    class LostErrorPlaceholder(Exception):
        """Fallback exception used when pylsl is unavailable."""

    LostError = LostErrorPlaceholder
    print(
        "WARNING: pylsl not available. Install pylsl to connect a Muse headset. "
        "Backend will stream mock data until a real headset is detected."
    )
else:
    StreamInlet = _pylsl_module.StreamInlet
    resolve_stream = _pylsl_module.resolve_stream
    LostError = _pylsl_module.LostError

app = FastAPI(title="NeuroCoach Backend")

# CORS middleware for Next.js frontend
# Supports both development and production origins
# For network access (Windows server), you may need to add client IPs to ALLOWED_ORIGINS
# Or set ALLOWED_ORIGINS="*" for development (less secure)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
active_connections: List[WebSocket] = []
muse_stream: Optional[StreamInlet] = None
stream_active = False
mock_mode = False

# Sample buffer for FFT processing (need window of samples for frequency analysis)
sample_buffer: List[float] = []
BUFFER_SIZE = 256  # ~1 second at 256Hz

# Baseline values for focus detection
baseline_alpha = 50.0
baseline_beta = 60.0
calibration_data: Optional[dict] = None
calibration_ratio_threshold = 1.2
calibration_relax_alpha: Optional[float] = None

rng = np.random.default_rng()
MOCK_SAMPLE_RATE = 256.0


def calculate_band_power(data: np.ndarray, fs: float, low_freq: float, high_freq: float) -> float:
    """Calculate band power using FFT"""
    fft = np.fft.fft(data)
    freqs = np.fft.fftfreq(len(data), 1/fs)
    
    # Find indices in frequency band
    band_mask = (freqs >= low_freq) & (freqs <= high_freq)
    band_power = np.sum(np.abs(fft[band_mask]) ** 2)
    
    # Normalize
    total_power = np.sum(np.abs(fft) ** 2)
    if total_power == 0:
        return 0.0
    
    return (band_power / total_power) * 100


def process_eeg_sample(sample_buffer: List[float], fs: float) -> dict:
    """
    Process buffered EEG samples into frequency bands using FFT
    Returns: {timestamp, alpha, beta, gamma, delta, theta}
    """
    if len(sample_buffer) < 64:  # Need minimum samples for FFT
        # Return zeros if buffer too small (waiting for more data)
        return {
            "timestamp": int(time.time() * 1000),
            "alpha": 0.0,
            "beta": 0.0,
            "gamma": 0.0,
            "delta": 0.0,
            "theta": 0.0,
        }
    
    # Convert to numpy array and apply window function (Hann window)
    samples = np.array(sample_buffer[-BUFFER_SIZE:])
    window = np.hanning(len(samples))
    windowed_samples = samples * window
    
    # Frequency bands (Hz)
    # Delta: 0.5-4, Theta: 4-8, Alpha: 8-13, Beta: 13-30, Gamma: 30-100
    delta = calculate_band_power(windowed_samples, fs, 0.5, 4.0)
    theta = calculate_band_power(windowed_samples, fs, 4.0, 8.0)
    alpha = calculate_band_power(windowed_samples, fs, 8.0, 13.0)
    beta = calculate_band_power(windowed_samples, fs, 13.0, 30.0)
    gamma = calculate_band_power(windowed_samples, fs, 30.0, 100.0)
    
    return {
        "timestamp": int(time.time() * 1000),
        "alpha": float(alpha),
        "beta": float(beta),
        "gamma": float(gamma),
        "delta": float(delta),
        "theta": float(theta),
    }


def analyze_focus_state(reading: dict) -> dict:
    """Analyze focus state from EEG reading"""
    global baseline_alpha, baseline_beta, calibration_data, calibration_ratio_threshold, calibration_relax_alpha

    alpha = reading["alpha"]
    beta = reading["beta"]
    
    # If no data yet (zeros), return default state
    if alpha == 0 and beta == 0:
        return {
            "isFocused": False,
            "confidence": 0.0,
            "alertTriggered": False,
        }
    
    # Update baseline (simple moving average) only if we have real data
    if alpha > 0 and beta > 0:
        if calibration_relax_alpha is not None:
            # When calibrated, keep baseline center near calibrated values but still react slowly
            baseline_alpha = baseline_alpha * 0.98 + calibration_relax_alpha * 0.02
        else:
            baseline_alpha = baseline_alpha * 0.95 + alpha * 0.05
        baseline_beta = baseline_beta * 0.95 + beta * 0.05
    
    # Focus detection: Beta/Alpha ratio
    ratio = beta / alpha if alpha > 0 else 0
    ratio_threshold = calibration_ratio_threshold if calibration_data else 1.2
    is_focused = ratio >= ratio_threshold if ratio > 0 else False
    
    # Confidence based on ratio
    # Confidence increases as ratio diverges from threshold (either direction)
    if ratio > 0:
        diff = abs(ratio - ratio_threshold)
        confidence = min(diff / max(ratio_threshold * 0.75, 0.01), 1.0)
    else:
        confidence = 0.0
    
    # Alert if alpha spike detected (>40% above baseline)
    alpha_reference = calibration_relax_alpha if calibration_relax_alpha is not None else baseline_alpha
    alpha_spike = alpha > (alpha_reference * 1.4) if alpha_reference > 0 else False
    alert_triggered = alpha_spike and not is_focused
    
    return {
        "isFocused": is_focused,
        "confidence": float(confidence),
        "alertTriggered": alert_triggered,
    }


def apply_calibration(calibration: dict) -> dict:
    """
    Apply calibration data received from frontend.
    Expected structure:
    {
        "focusBaseline": {"beta": float, "alpha": float},
        "distractionBaseline": {"beta": float, "alpha": float},
        "thresholds": {"focusRatio": float, "relaxRatio": float}
    }
    """
    global baseline_alpha, baseline_beta, calibration_data, calibration_ratio_threshold, calibration_relax_alpha

    focus_baseline = calibration.get("focusBaseline", {})
    distraction_baseline = calibration.get("distractionBaseline", {})
    thresholds = calibration.get("thresholds", {})

    focus_beta = float(focus_baseline.get("beta", baseline_beta))
    focus_alpha = float(focus_baseline.get("alpha", baseline_alpha))
    relax_beta = float(distraction_baseline.get("beta", baseline_beta))
    relax_alpha = float(distraction_baseline.get("alpha", baseline_alpha))

    focus_ratio = float(thresholds.get("focusRatio", focus_beta / focus_alpha if focus_alpha > 0 else 1.4))
    relax_ratio = float(thresholds.get("relaxRatio", relax_beta / relax_alpha if relax_alpha > 0 else 0.9))

    # Clamp ratios to reasonable ranges
    focus_ratio = max(0.5, min(focus_ratio, 4.0))
    relax_ratio = max(0.3, min(relax_ratio, 3.0))

    # Use midpoint between focus and relax ratios as threshold
    calibration_ratio_threshold = (focus_ratio + relax_ratio) / 2.0 if focus_ratio > 0 and relax_ratio > 0 else 1.2

    # Update baselines - focused beta should be higher, relaxed alpha should be higher
    baseline_beta = focus_beta if focus_beta > 0 else baseline_beta
    baseline_alpha = relax_alpha if relax_alpha > 0 else baseline_alpha
    calibration_relax_alpha = relax_alpha if relax_alpha > 0 else None

    calibration_data = {
        "focusBaseline": {
            "beta": baseline_beta,
            "alpha": focus_alpha,
        },
        "distractionBaseline": {
            "beta": relax_beta,
            "alpha": baseline_alpha,
        },
        "thresholds": {
            "focusRatio": focus_ratio,
            "relaxRatio": relax_ratio,
            "ratioThreshold": calibration_ratio_threshold,
        },
    }

    return {
        "ratioThreshold": calibration_ratio_threshold,
        "baselineAlpha": baseline_alpha,
        "baselineBeta": baseline_beta,
        "focusRatio": focus_ratio,
        "relaxRatio": relax_ratio,
    }


async def _broadcast_json(payload: dict) -> None:
    """Send a JSON payload to all connected clients."""

    disconnected: List[WebSocket] = []
    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception as exc:
            print(f"Error sending to client: {exc}")
            disconnected.append(ws)

    for ws in disconnected:
        if ws in active_connections:
            active_connections.remove(ws)


async def _stream_mock_data(reason: str) -> None:
    """Fallback EEG stream when Muse headset or pylsl is unavailable."""

    global mock_mode
    mock_mode = True

    print(f"Starting mock EEG stream ({reason}).")
    await _broadcast_json(
        {
            "type": "muse_status",
            "museConnected": False,
            "mockMode": True,
            "message": f"Using mock data: {reason}",
        }
    )

    global baseline_alpha, baseline_beta
    baseline_alpha = 50.0
    baseline_beta = 60.0

    start = time.time()

    while stream_active and active_connections:
        elapsed = time.time() - start
        alpha = 48.0 + 7.0 * np.sin(elapsed / 2.5) + rng.normal(0, 2.0)
        alpha = max(alpha, 5.0)
        beta = alpha * (1.05 + 0.25 * np.sin(elapsed / 3.0) + rng.normal(0, 0.05))
        beta = max(beta, 5.0)
        theta = alpha * (0.65 + 0.1 * np.sin(elapsed / 6.0) + rng.normal(0, 0.05))
        delta = alpha * (0.55 + 0.1 * np.cos(elapsed / 5.0) + rng.normal(0, 0.05))
        gamma = beta * (0.7 + 0.1 * np.sin(elapsed / 4.0) + rng.normal(0, 0.03))

        reading = {
            "timestamp": int(time.time() * 1000),
            "alpha": float(alpha),
            "beta": float(beta),
            "gamma": float(max(gamma, 1.0)),
            "delta": float(max(delta, 1.0)),
            "theta": float(max(theta, 1.0)),
        }

        focus_state = analyze_focus_state(reading)

        await _broadcast_json(
            {
                "type": "eeg_data",
                "reading": reading,
                "focusState": focus_state,
                "mockMode": True,
            }
        )

        await asyncio.sleep(0.2)

    print("Mock EEG stream stopped.")
    mock_mode = False


async def stream_muse_data():
    """Stream Muse data to all connected WebSocket clients"""
    global muse_stream, stream_active, baseline_alpha, baseline_beta, sample_buffer, mock_mode

    if stream_active:
        return

    stream_active = True

    try:
        # Resolve Muse stream (looks for Muse LSL stream)
        if resolve_stream is None or StreamInlet is None:
            await _stream_mock_data("pylsl not installed")
            return

        print("Looking for Muse LSL stream...")
        print("Make sure BlueMuse or Muse Direct is running and streaming.")
        streams = resolve_stream('type', 'EEG')

        if not streams:
            error_msg = (
                "ERROR: No Muse LSL stream found.\n"
                "To connect Muse:\n"
                "  1. Install BlueMuse: https://github.com/kowalej/BlueMuse\n"
                "  2. Connect Muse headset via Bluetooth to your computer\n"
                "  3. Open BlueMuse and select your device\n"
                "  4. Click 'Start LSL Stream'\n"
                "  5. Or use Muse Direct app\n"
                "\nWaiting for Muse connection..."
            )
            print(error_msg)

            # Send error to connected clients
            error_message = {
                "type": "error",
                "message": "No Muse headset detected. Please connect your Muse headset and start LSL stream in BlueMuse.",
            }
            await _broadcast_json(error_message)

            # Keep trying to find stream
            while not streams and active_connections:
                await asyncio.sleep(2)
                try:
                    streams = resolve_stream('type', 'EEG', timeout=1.0)
                except:
                    streams = []
                if streams:
                    break

            if not streams:
                print("Failed to find Muse stream. Backend will wait for connection.")
                # Notify clients that Muse is not connected
                muse_disconnected_msg = {
                    "type": "muse_status",
                    "museConnected": False,
                    "mockMode": True,
                    "message": "No Muse headset detected. Using mock data.",
                }
                await _broadcast_json(muse_disconnected_msg)
                await _stream_mock_data("no Muse headset detected")
                return

        # Create inlet
        inlet = StreamInlet(streams[0])
        print(f"Connected to stream: {streams[0].name()}")

        # Get stream info
        fs = inlet.info().nominal_srate()
        if fs == 0:
            fs = 256  # Default Muse sample rate

        print(f"Sample rate: {fs} Hz")
        stream_active = True
        muse_stream = inlet
        mock_mode = False
        
        # Notify all clients that Muse is now connected
        muse_connected_msg = {
            "type": "muse_status",
            "museConnected": True,
            "message": "Muse headset connected",
        }
        await _broadcast_json(muse_connected_msg)

        # Reset baselines and buffer
        baseline_alpha = 50.0
        baseline_beta = 60.0
        sample_buffer = []

        # Stream loop
        while stream_active and active_connections:
            try:
                # Pull sample (timeout after 1 second)
                sample, timestamp = inlet.pull_sample(timeout=1.0)

                if sample:
                    # Process sample (average across channels for simplicity)
                    # Muse has 4 channels: TP9, AF7, AF8, TP10
                    avg_sample = float(np.mean(sample))
                    
                    # Add to buffer
                    sample_buffer.append(avg_sample)
                    # Keep buffer size manageable
                    if len(sample_buffer) > BUFFER_SIZE * 2:
                        sample_buffer = sample_buffer[-BUFFER_SIZE:]
                    
                    # Process into frequency bands (only if we have enough samples)
                    if len(sample_buffer) >= 64:
                        reading = process_eeg_sample(sample_buffer, fs)
                    else:
                        # Return zeros while buffer fills (waiting for enough data)
                        reading = {
                            "timestamp": int(time.time() * 1000),
                            "alpha": 0.0,
                            "beta": 0.0,
                            "gamma": 0.0,
                            "delta": 0.0,
                            "theta": 0.0,
                        }
                    
                    # Analyze focus state
                    focus_state = analyze_focus_state(reading)

                    # Send to all connected clients
                    message = {
                        "type": "eeg_data",
                        "reading": reading,
                        "focusState": focus_state,
                    }
                    await _broadcast_json(message)

            except LostError:
                print("Stream lost. Reconnecting...")
                muse_stream = None
                # Notify clients that Muse is disconnected
                muse_disconnected_msg = {
                    "type": "muse_status",
                    "museConnected": False,
                    "message": "Muse stream lost. Reconnecting...",
                }
                await _broadcast_json(muse_disconnected_msg)

                try:
                    streams = resolve_stream('type', 'EEG', timeout=2.0)
                except:
                    streams = []
                if streams:
                    inlet = StreamInlet(streams[0])
                    muse_stream = inlet
                    print("Reconnected to Muse stream")
                    # Notify clients that Muse is reconnected
                    muse_connected_msg = {
                        "type": "muse_status",
                        "museConnected": True,
                        "message": "Muse headset reconnected",
                    }
                    await _broadcast_json(muse_connected_msg)
                else:
                    error_msg = "Muse stream lost. Please reconnect your headset and restart LSL stream."
                    print(error_msg)
                    error_message = {
                        "type": "error",
                        "message": error_msg,
                    }
                    await _broadcast_json(error_message)
                    # Wait and retry
                    await asyncio.sleep(2)
                    continue

            await asyncio.sleep(0.1)  # ~10Hz update rate

    except Exception as e:
        print(f"Error in stream_muse_data: {e}")
        error_message = {
            "type": "error",
            "message": f"Backend error: {str(e)}",
        }
        await _broadcast_json(error_message)
    finally:
        muse_stream = None
        stream_active = False
        mock_mode = False


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time EEG streaming"""
    await websocket.accept()
    active_connections.append(websocket)
    print(f"Client connected. Total connections: {len(active_connections)}")
    
    try:
        # Send connection confirmation with current status
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to NeuroCoach backend",
            "museConnected": muse_stream is not None,
            "mockMode": mock_mode,
            "streamActive": stream_active,
        })
        
        # Start streaming if not already active
        if not stream_active:
            asyncio.create_task(stream_muse_data())
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                # Handle client messages if needed
                message = json.loads(data)
                msg_type = message.get("type")
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "calibration_update":
                    calibration = message.get("calibration")
                    if calibration:
                        applied = apply_calibration(calibration)
                        await websocket.send_json({
                            "type": "calibration_ack",
                            "status": "applied",
                            "payload": applied,
                        })
                        # Inform other clients of calibration change
                        await _broadcast_json({
                            "type": "calibration_status",
                            "calibrated": True,
                            "payload": applied,
                        })
                elif msg_type == "calibration_reset":
                    # Reset to defaults
                    baseline_alpha_default = 50.0
                    baseline_beta_default = 60.0
                    global baseline_alpha, baseline_beta, calibration_data, calibration_ratio_threshold, calibration_relax_alpha
                    baseline_alpha = baseline_alpha_default
                    baseline_beta = baseline_beta_default
                    calibration_ratio_threshold = 1.2
                    calibration_relax_alpha = None
                    calibration_data = None
                    await websocket.send_json({
                        "type": "calibration_ack",
                        "status": "reset",
                        "payload": {
                            "ratioThreshold": calibration_ratio_threshold,
                            "baselineAlpha": baseline_alpha,
                            "baselineBeta": baseline_beta,
                        },
                    })
                    await _broadcast_json({
                        "type": "calibration_status",
                        "calibrated": False,
                    })
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        print(f"Client removed. Remaining connections: {len(active_connections)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "connections": len(active_connections),
        "stream_active": stream_active,
        "mock_mode": mock_mode,
    }


@app.get("/status")
async def status():
    """Get backend status"""
    return {
        "connected": len(active_connections) > 0,
        "stream_active": stream_active,
        "muse_connected": muse_stream is not None,
        "mock_mode": mock_mode,
    }


if __name__ == "__main__":
    import uvicorn
    # host="0.0.0.0" allows connections from any network interface (localhost + network)
    # For network access, ensure Windows Firewall allows port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

