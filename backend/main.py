"""
Neuroadaptive Focus Coach - Python Backend
Handles Muse headset connection via LSL and streams EEG data to frontend via WebSocket
"""

import asyncio
import json
import time
import os
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

# Import LSL - required for Muse connection
try:
    from pylsl import StreamInlet, resolve_stream, LostError
except (ImportError, RuntimeError) as e:
    print(f"ERROR: LSL library not available: {e}")
    print("Please install LSL: brew install labstreaminglayer/tap/lsl")
    print("And ensure DYLD_LIBRARY_PATH is set: export DYLD_LIBRARY_PATH=/opt/homebrew/lib")
    raise

app = FastAPI(title="NeuroCoach Backend")

# CORS middleware for Next.js frontend
# Supports both development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
active_connections: List[WebSocket] = []
muse_stream: Optional[StreamInlet] = None
stream_active = False

# Sample buffer for FFT processing (need window of samples for frequency analysis)
sample_buffer: List[float] = []
BUFFER_SIZE = 256  # ~1 second at 256Hz

# Baseline values for focus detection
baseline_alpha = 50.0
baseline_beta = 60.0


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
    global baseline_alpha, baseline_beta
    
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
        baseline_alpha = baseline_alpha * 0.95 + alpha * 0.05
        baseline_beta = baseline_beta * 0.95 + beta * 0.05
    
    # Focus detection: Beta/Alpha ratio
    ratio = beta / alpha if alpha > 0 else 0
    is_focused = ratio > 1.2 if ratio > 0 else False
    
    # Confidence based on ratio
    confidence = min(abs(ratio - 1) / 1.5, 1.0) if ratio > 0 else 0.0
    
    # Alert if alpha spike detected (>40% above baseline)
    alpha_spike = alpha > (baseline_alpha * 1.4) if baseline_alpha > 0 else False
    alert_triggered = alpha_spike and not is_focused
    
    return {
        "isFocused": is_focused,
        "confidence": float(confidence),
        "alertTriggered": alert_triggered,
    }


async def stream_muse_data():
    """Stream Muse data to all connected WebSocket clients"""
    global muse_stream, stream_active, baseline_alpha, baseline_beta, sample_buffer
    
    try:
        # Resolve Muse stream (looks for Muse LSL stream)
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
            for ws in active_connections:
                try:
                    await ws.send_json(error_message)
                except:
                    pass
            
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
                    "message": "No Muse headset detected",
                }
                for ws in active_connections:
                    try:
                        await ws.send_json(muse_disconnected_msg)
                    except:
                        pass
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
        
        # Notify all clients that Muse is now connected
        muse_connected_msg = {
            "type": "muse_status",
            "museConnected": True,
            "message": "Muse headset connected",
        }
        for ws in active_connections:
            try:
                await ws.send_json(muse_connected_msg)
            except:
                pass
        
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
                    
                    disconnected = []
                    for ws in active_connections:
                        try:
                            await ws.send_json(message)
                        except Exception as e:
                            print(f"Error sending to client: {e}")
                            disconnected.append(ws)
                    
                    # Remove disconnected clients
                    for ws in disconnected:
                        if ws in active_connections:
                            active_connections.remove(ws)
                
            except LostError:
                print("Stream lost. Reconnecting...")
                muse_stream = None
                # Notify clients that Muse is disconnected
                muse_disconnected_msg = {
                    "type": "muse_status",
                    "museConnected": False,
                    "message": "Muse stream lost. Reconnecting...",
                }
                for ws in active_connections:
                    try:
                        await ws.send_json(muse_disconnected_msg)
                    except:
                        pass
                
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
                    for ws in active_connections:
                        try:
                            await ws.send_json(muse_connected_msg)
                        except:
                            pass
                else:
                    error_msg = "Muse stream lost. Please reconnect your headset and restart LSL stream."
                    print(error_msg)
                    error_message = {
                        "type": "error",
                        "message": error_msg,
                    }
                    for ws in active_connections:
                        try:
                            await ws.send_json(error_message)
                        except:
                            pass
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
        for ws in active_connections:
            try:
                await ws.send_json(error_message)
            except:
                pass


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
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
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
    }


@app.get("/status")
async def status():
    """Get backend status"""
    return {
        "connected": len(active_connections) > 0,
        "stream_active": stream_active,
        "muse_connected": muse_stream is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

