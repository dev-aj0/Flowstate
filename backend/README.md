# NeuroCoach Backend

Python backend for connecting to Muse headset and streaming EEG data to the Next.js frontend.

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or with a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Connect Muse Headset

**Option A: Using BlueMuse (Recommended for Windows/Mac)**
1. Download and install [BlueMuse](https://github.com/kowalej/BlueMuse) (free, open-source)
2. Connect your Muse headset via Bluetooth to your computer
3. Open BlueMuse
4. Select your Muse device and click "Start LSL Stream"
5. The backend will automatically detect the LSL stream

**Option B: Using Muse Direct App**
1. Install [Muse Direct](https://www.choosemuse.com/muse-direct/) on your device
2. Connect your Muse headset via Bluetooth
3. Start streaming in Muse Direct
4. The backend will automatically detect the LSL stream

**Option C: Using Python Muse SDK**
- Install additional dependencies:
  ```bash
  pip install muse-lsl
  ```
- Run Muse connector script separately (more complex setup)

### 3. Run the Backend

**Option A: Using the startup script (Recommended for macOS)**
```bash
./start.sh
```

**Option B: Manual start with environment variable**
```bash
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
python3 main.py
```

**Option C: Using uvicorn directly**
```bash
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
uvicorn main:app --reload --port 8000
```

**Note for macOS:** The `DYLD_LIBRARY_PATH` environment variable is required for macOS to find the LSL library. The startup script handles this automatically.

The backend will:
- Start on `http://localhost:8000`
- Look for Muse LSL stream
- Fall back to mock data if no Muse is found
- Stream EEG data via WebSocket at `/ws`

## API Endpoints

- `GET /` - Health check
- `GET /status` - Backend status
- `WS /ws` - WebSocket endpoint for real-time EEG streaming

## WebSocket Message Format

**From Server:**
```json
{
  "type": "eeg_data",
  "reading": {
    "timestamp": 1234567890,
    "alpha": 50.5,
    "beta": 60.2,
    "gamma": 30.1,
    "delta": 40.0,
    "theta": 45.3
  },
  "focusState": {
    "isFocused": true,
    "confidence": 0.85,
    "alertTriggered": false
  }
}
```

**To Server:**
```json
{
  "type": "ping"
}
```

## Troubleshooting

1. **No Muse stream found**: Make sure Muse Direct is running and streaming
2. **Connection refused**: Check that backend is running on port 8000
3. **Import errors**: Make sure all dependencies are installed
4. **Mock mode**: Backend automatically falls back to mock data if Muse isn't found

