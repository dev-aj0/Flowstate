# 🧠 Neuroadaptive Focus Coach

A web application that uses EEG data from the Muse 2 headset to detect when students are losing focus during study sessions and provides gentle, real-time alerts to refocus.

## 🚀 Quick Start

> **Note**: This repository is currently **private**. It will be made publicly available soon. If you have access, follow the setup instructions below.

1. **Clone the repository**: `git clone https://github.com/YOUR_USERNAME/hosa_project.git`
2. **Install dependencies**: See [Step 3 & 4](#step-3-install-frontend-dependencies) below
3. **Start backend**: `cd backend && python main.py` (in one terminal)
4. **Start frontend**: `npm run dev` (in another terminal)
5. **Open browser**: http://localhost:3000

**Full setup instructions below ↓**

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

## 📥 Getting Started

### Step 1: Download the Code

> **⚠️ Important**: This repository is currently **private** and not publicly available yet. It will be made available soon. If you have access to the repository, follow the instructions below.

**Option A: Clone with Git (Recommended)**

1. **Get the repository URL:**
   - If you have access, go to the repository on GitHub
   - Click the green "Code" button
   - Copy the HTTPS or SSH URL

2. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hosa_project.git
   cd hosa_project
   ```
   
   **Or with SSH:**
   ```bash
   git clone git@github.com:YOUR_USERNAME/hosa_project.git
   cd hosa_project
   ```

3. **Verify the clone:**
   - You should see all project files in the directory
   - Check that `package.json` and `backend/main.py` exist

**Option B: Download ZIP**

1. Go to your GitHub repository (if you have access)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to your desired location
5. Open a terminal in the extracted folder
6. Rename the folder from `hosa_project-main` to `hosa_project` (optional)

**If you don't have access yet:**
- The repository will be made publicly available soon
- Check back later or contact the repository owner for access

### Step 2: Check Prerequisites

Before starting, make sure you have:

- **Node.js 18+** and npm
  - Check: `node --version` (should show v18 or higher)
  - Download: https://nodejs.org/
  
- **Python 3.9+** and pip
  - Check: `python --version` (should show 3.9 or higher)
  - Download: https://www.python.org/downloads/
  - ⚠️ **Important**: During Python installation, check "Add Python to PATH"

- **Git** (optional, for cloning)
  - Download: https://git-scm.com/downloads

- **Muse 2 Headset** (optional)
  - App works in mock mode without it for testing
  - See Step 5 for Muse setup instructions

### Step 3: Install Frontend Dependencies

Open a terminal in the project root directory and run:

```bash
npm install --legacy-peer-deps
```

**Expected output:** Dependencies will install (this may take 2-5 minutes)

**Troubleshooting:**
- If you get errors, try: `npm cache clean --force` then retry
- On Windows, you may need to run PowerShell as Administrator

### Step 4: Install Backend Dependencies

**Windows:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

**Mac/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

**Expected output:** Python packages will install (this may take 1-3 minutes)

**Troubleshooting:**
- If `python` doesn't work, try `python3`
- On Windows, if you get "execution policy" error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Make sure pip is up to date: `python -m pip install --upgrade pip`

### Step 5: Setup Muse Headset (Optional)

The app works without a Muse headset (uses mock data), but for real brainwave tracking:

**Option A: Using BlueMuse (Recommended for Windows/Mac)**

1. **Download BlueMuse:**
   - Go to: https://github.com/kowalej/BlueMuse/releases
   - Download the latest release for your OS
   - Windows: Download `.exe` installer
   - Mac: Follow BlueMuse installation instructions

2. **Install and Setup:**
   - Install BlueMuse
   - Connect your Muse headset via Bluetooth to your computer
   - Open BlueMuse application
   - Select your Muse device from the list
   - Click **"Start LSL Stream"**
   - You should see "Streaming..." status

3. **Verify Connection:**
   - The backend will automatically detect the LSL stream when you start it
   - You'll see "Connected to stream: Muse-XXXX" in the backend console

**Option B: Using Muse Direct App**

1. Install [Muse Direct](https://www.choosemuse.com/muse-direct/) on your device
2. Connect your Muse headset via Bluetooth
3. Start streaming in Muse Direct
4. The backend will automatically detect the LSL stream

**Option C: Without Muse (Mock Mode)**

- The app will automatically use realistic mock EEG data
- Perfect for testing and development
- All features work except real brainwave tracking

### Step 6: Configure Environment Variables (Optional)

**For AI Brainwave Analysis (Optional but Recommended):**

1. Create `.env.local` file in the project root (if it doesn't exist)
2. Add your OpenAI API key:
   ```env
   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
   ```
3. Get your API key from: https://platform.openai.com/api-keys

**Note:** Without an API key, the app uses rule-based timer optimization (still works great!)

**For Network Access (Windows Server Setup):**

If running backend on one machine and frontend on another:
```env
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8001/ws
```
Replace `192.168.1.100` with your backend machine's IP address.

### Step 7: Run the Application

You need **two terminals** running simultaneously:

#### **Terminal 1: Start Backend**

**Windows (PowerShell):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Mac/Linux:**
```bash
cd backend
source venv/bin/activate
python3 main.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
Looking for Muse LSL stream...
```

**Quick Start Script (Windows):**
You can also use the provided PowerShell script:
```powershell
.\start-dev.ps1
```
This automatically starts both backend and frontend in separate windows!

#### **Terminal 2: Start Frontend**

Open a **new terminal** (keep Terminal 1 running):

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in 2.3s
```

### Step 8: Open the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You should see the Flowstate home page

**What to expect:**
- ✅ Frontend connects to backend automatically
- ✅ WebSocket connection established
- ✅ If Muse is connected: "Muse Connected" status
- ✅ If no Muse: "Mock Mode" (still fully functional)

### Step 9: First-Time Setup

1. **Go to Settings:**
   - Click "Settings" in the sidebar or navigate to `/settings`
   - Set your name (optional)
   - Optionally set a self-reported condition (for timer optimization only, not diagnosis)
   - Check Muse connection status

2. **Optional: Run Calibration:**
   - Click "Start Calibration" in Settings
   - Follow the guided focus/relaxation sequence
   - This personalizes distraction detection thresholds
   - Takes about 2-3 minutes

3. **Start Your First Session:**
   - Go to "Session" page (`/session`)
   - Click "Start Session"
   - Watch your brainwaves in real-time!
   - Enable Pomodoro mode for focus/break cycles

### Step 10: Using the App

**During a Session:**
- **Live Focus Meter**: Shows your current focus percentage
- **EEG Waveform**: Real-time visualization of brainwaves
- **Focus State**: See when you're focused vs relaxed
- **Distraction Alerts**: Get gentle prompts when attention drifts
- **Pomodoro Timer**: Automatic focus/break cycles (optional)

**After a Session:**
- View insights at `/insights`
- See your focus patterns over time
- Track your progress
- Export data as CSV

**AI Analysis (if API key set):**
- Timer automatically optimizes based on your brainwave patterns
- AI analyzes when your focus drops
- Recommendations appear during sessions
- Shows confidence scores and reasoning

## 📚 Next Steps

### After Installation

1. **Explore the App:**
   - Navigate through the different pages (Session, Insights, Settings, Instructions)
   - Try starting a session in mock mode to see how it works
   - Check out the Insights page to see session analytics

2. **Connect Your Muse (If You Have One):**
   - Follow Step 5 above to set up BlueMuse
   - Start a session and watch your real brainwaves!
   - Run calibration for personalized thresholds

3. **Enable AI Analysis (Optional):**
   - Get an OpenAI API key from https://platform.openai.com/api-keys
   - Add it to `.env.local` as shown in Step 6
   - Restart the frontend to enable AI-powered timer optimization
   - See [LLM_SETUP.md](LLM_SETUP.md) for detailed AI setup instructions

4. **Customize Settings:**
   - Set your profile in Settings
   - Adjust alert preferences (sound, popup, etc.)
   - Configure default session duration
   - Run calibration for better accuracy

### Understanding the Features

- **Live EEG Monitoring**: Real-time brainwave visualization
- **Focus Detection**: Beta/Alpha ratio analysis determines focus state
- **Distraction Alerts**: Gentle prompts when attention drifts
- **Pomodoro Mode**: Automatic focus/break cycles with AI optimization
- **Session Analytics**: Track your focus patterns over time
- **AI Analysis**: LLM analyzes your brainwave patterns for optimal timer settings

## ⚙️ Configuration

### Backend URL

Set the WebSocket URL in `.env.local` (optional, defaults work for local development):

**Local Development (Default):**
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws
```

**Network Access (Windows Server Setup):**
```env
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8001/ws
```
Replace `192.168.1.100` with your backend machine's IP address.

**Note:** Default is `ws://localhost:8001/ws` if not set. For Windows server setup, see [backend/README_WINDOWS.md](backend/README_WINDOWS.md)

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
uvicorn main:app --reload --port 8001
```

## How It Works

1. **Muse Connection**: Python backend connects to Muse via LSL (Lab Streaming Layer)
2. **EEG Processing**: Raw EEG signals are processed into frequency bands (Alpha, Beta, Gamma, Delta, Theta)
3. **Focus Detection**: Beta/Alpha ratio analysis determines focus state
4. **Real-time Streaming**: Processed data streams to frontend via WebSocket
5. **Visualization**: Frontend displays live waveforms and focus metrics
6. **Alerts**: When distraction is detected, user receives gentle visual/audio prompts

## 🛠️ Troubleshooting

### Backend Issues

**Backend won't start:**
- ✅ Make sure Python 3.9+ is installed: `python --version`
- ✅ Check virtual environment is activated (you should see `(venv)` in terminal)
- ✅ Verify all dependencies installed: `pip list` should show fastapi, uvicorn, pylsl
- ✅ Try reinstalling: `pip install -r requirements.txt --force-reinstall`

**Backend won't connect to frontend:**
- ✅ Make sure backend is running on port 8001
- ✅ Check for port conflicts: `netstat -ano | findstr :8001` (Windows) or `lsof -i :8001` (Mac/Linux)
- ✅ Verify CORS settings in `backend/main.py` allow your frontend URL
- ✅ Check Windows Firewall isn't blocking port 8001

**Muse not detected:**
- ✅ Make sure BlueMuse is running and streaming (should show "Streaming..." status)
- ✅ Verify Muse is connected via Bluetooth
- ✅ Check BlueMuse shows your device in the list
- ✅ Backend will automatically use mock data if Muse isn't found (this is normal)

### Frontend Issues

**Frontend won't start:**
- ✅ Make sure Node.js 18+ is installed: `node --version`
- ✅ Delete `node_modules` and `package-lock.json`, then run `npm install --legacy-peer-deps` again
- ✅ Check for port conflicts on port 3000
- ✅ Try clearing npm cache: `npm cache clean --force`

**Frontend shows "Mock Mode" or "Not Connected":**
- ✅ This is **normal** if backend isn't running or Muse isn't connected
- ✅ App works perfectly in mock mode for testing
- ✅ Make sure backend is running in a separate terminal
- ✅ Check browser console for WebSocket errors (F12 → Console tab)

**WebSocket connection errors:**
- ✅ Verify backend is running: Check Terminal 1 shows "Uvicorn running on http://0.0.0.0:8001"
- ✅ Check `.env.local` has correct WebSocket URL: `NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws`
- ✅ Restart both backend and frontend after changing `.env.local`
- ✅ Check browser console for specific error messages

### Python/Virtual Environment Issues

**"python is not recognized" (Windows):**
- ✅ Use `python3` instead of `python`
- ✅ Reinstall Python and check "Add Python to PATH" during installation
- ✅ Or use full path: `C:\Python39\python.exe`

**"venv\Scripts\Activate.ps1 cannot be loaded" (Windows):**
- ✅ Run PowerShell as Administrator
- ✅ Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- ✅ Then try activating venv again

**"ModuleNotFoundError" or import errors:**
- ✅ Make sure virtual environment is activated
- ✅ Reinstall requirements: `pip install -r requirements.txt`
- ✅ Check you're in the `backend` directory when installing

### Muse/BlueMuse Issues

**BlueMuse won't start streaming:**
- ✅ Make sure Muse is paired via Bluetooth first
- ✅ Try disconnecting and reconnecting Muse
- ✅ Restart BlueMuse application
- ✅ Check BlueMuse logs for error messages
- ✅ Verify LSL is installed (usually comes with BlueMuse)

**Backend can't find LSL stream:**
- ✅ Make sure BlueMuse shows "Streaming..." status
- ✅ Wait a few seconds after starting BlueMuse stream
- ✅ Check backend console for "Looking for Muse LSL stream..." message
- ✅ Try stopping and restarting the LSL stream in BlueMuse

### General Issues

**Port already in use:**
- ✅ Find what's using the port:
  - Windows: `netstat -ano | findstr :8001` (or :3000)
  - Mac/Linux: `lsof -i :8001` (or :3000)
- ✅ Kill the process or use a different port
- ✅ For backend, edit `backend/main.py` last line to change port
- ✅ For frontend, use: `npm run dev -- -p 3001`

**Dependencies won't install:**
- ✅ Update pip: `python -m pip install --upgrade pip`
- ✅ Update npm: `npm install -g npm@latest`
- ✅ Try installing with `--force` flag
- ✅ Check your internet connection
- ✅ On Windows, try running terminal as Administrator

**AI Analysis not working:**
- ✅ Check `.env.local` has `NEXT_PUBLIC_OPENAI_API_KEY` set
- ✅ Verify API key is valid (starts with `sk-`)
- ✅ Restart frontend after adding API key
- ✅ Check browser console for API errors
- ✅ App will use rule-based optimization if LLM unavailable (this is normal)

## 🚀 Quick Reference

### Starting the App

**Windows (Easiest):**
```powershell
.\start-dev.ps1
```

**Manual (All Platforms):**
```bash
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# OR
source venv/bin/activate     # Mac/Linux
python main.py

# Terminal 2 - Frontend
npm run dev
```

### Stopping the App

- **Backend**: Press `Ctrl+C` in Terminal 1
- **Frontend**: Press `Ctrl+C` in Terminal 2
- **Both (Windows script)**: Close the PowerShell windows

### Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Backend Status**: http://localhost:8001/status
- **WebSocket**: ws://localhost:8001/ws

### Key Files

- **Backend**: `backend/main.py`
- **Frontend Config**: `.env.local`
- **Python Dependencies**: `backend/requirements.txt`
- **Node Dependencies**: `package.json`

### Common Commands

```bash
# Install frontend dependencies
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Mac/Linux
pip install -r requirements.txt

# Start development
npm run dev              # Frontend
python main.py           # Backend (from backend/ directory)

# Build for production
npm run build
npm run start
```

## License

MIT

## Credits

Built with ❤️ using Next.js, FastAPI, and Muse SDK
