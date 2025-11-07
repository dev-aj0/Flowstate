# 🧠 Neuroadaptive Focus Coach

A web application that uses EEG data from the Muse 2 headset to detect when students are losing focus during study sessions and provides gentle, real-time alerts to refocus.

## Features

- **Live EEG Monitoring** via Muse 2 headset
- **Beta Wave Tracking** to identify focus state
- **Alpha Spike Detection** for distraction or relaxation
- **Visual + Audio Refocus Prompts** when distraction is detected
- **Pomodoro Mode** with focus/break cycles
- **Session Analytics** and insights
- **Beautiful Zen Tech UI** with glassmorphism and smooth animations

## Architecture

- **Frontend**: Next.js 15 + React + TypeScript + TailwindCSS
- **Backend**: Python FastAPI + WebSocket + pyLSL (for Muse integration)
- **Real-time**: WebSocket connection for live EEG streaming

## Setup

### Prerequisites

- Node.js 18+ and npm/bun
- Python 3.9+ and pip
- Muse 2 headset (optional - app works in mock mode without it)

### 1. Install Frontend Dependencies

```bash
npm install --legacy-peer-deps
# or
bun install
```

### 2. Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Connect Muse Headset (Optional)

**Option A: Using BlueMuse (Recommended)**
1. Download and install [BlueMuse](https://github.com/kowalej/BlueMuse) (free, open-source)
   - Windows: Download the latest release
   - Mac: Requires additional setup (see BlueMuse docs)
2. Connect your Muse headset via Bluetooth to your computer
3. Open BlueMuse application
4. Select your Muse device from the list
5. Click "Start LSL Stream"
6. The backend will automatically detect the LSL stream

**Option B: Using Muse Direct App**
1. Install [Muse Direct](https://www.choosemuse.com/muse-direct/) on your device
2. Connect your Muse headset via Bluetooth
3. Start streaming in Muse Direct
4. The backend will automatically detect the LSL stream

**Option C: Windows Server Setup (Network Access)**
- Run backend on Windows machine with BlueMuse
- Connect from any device (Mac, phone, tablet) over network
- See [backend/README_WINDOWS.md](backend/README_WINDOWS.md) for detailed setup
- Perfect for using Muse on Windows while accessing from other devices

**Option D: Without Muse**
- The app requires a Muse headset connected via LSL
- Backend will wait for Muse connection

### 4. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
./start.sh
# or manually:
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
python3 main.py
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
# or
bun run dev
```

### 5. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

The frontend will automatically connect to the backend via WebSocket. If the backend isn't running, it will gracefully fall back to mock data.

## Configuration

### Backend URL

Set the WebSocket URL in `.env.local`:

**Local Development:**
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

**Network Access (Windows Server):**
```env
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws
```
Replace `192.168.1.100` with your Windows machine's IP address.

Default is `ws://localhost:8000/ws` if not set.

**Note:** For Windows server setup, see [backend/README_WINDOWS.md](backend/README_WINDOWS.md)

## Project Structure

```
neuro focus/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (EEG stream, timer)
│   └── lib/               # Utilities and storage
├── backend/               # Python backend
│   ├── main.py           # FastAPI server with WebSocket
│   └── requirements.txt  # Python dependencies
└── README.md
```

## Development

### Frontend Development

```bash
npm run dev     # Start dev server with hot reload
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Backend Development

```bash
cd backend
uvicorn main:app --reload --port 8000
```

## How It Works

1. **Muse Connection**: Python backend connects to Muse via LSL (Lab Streaming Layer)
2. **EEG Processing**: Raw EEG signals are processed into frequency bands (Alpha, Beta, Gamma, Delta, Theta)
3. **Focus Detection**: Beta/Alpha ratio analysis determines focus state
4. **Real-time Streaming**: Processed data streams to frontend via WebSocket
5. **Visualization**: Frontend displays live waveforms and focus metrics
6. **Alerts**: When distraction is detected, user receives gentle visual/audio prompts

## Troubleshooting

### Backend won't connect
- Make sure backend is running on port 8000
- Check that Muse Direct is running if using Muse
- Backend will automatically use mock data if Muse isn't found

### Frontend shows "Mock Mode"
- This is normal if backend isn't running or Muse isn't connected
- App works perfectly in mock mode for testing

### WebSocket connection errors
- Check CORS settings in `backend/main.py`
- Ensure backend URL matches in `.env.local`

## License

MIT

## Credits

Built with ❤️ using Next.js, FastAPI, and Muse SDK
