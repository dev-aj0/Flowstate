# Windows Server Setup Guide

This guide explains how to run the backend on a Windows machine with BlueMuse, allowing any device (Mac, phone, tablet) to connect remotely.

## Architecture

```
Windows Machine (Server)
├── Muse Headset (Bluetooth)
├── BlueMuse (LSL Stream)
├── Python Backend (WebSocket Server)
└── Network Access (Port 8000)

Any Device (Client)
├── Web Browser
└── Connects to Windows IP:8000 via WebSocket
```

## Prerequisites

1. **Windows Machine** with:
   - Python 3.8+ installed
   - Muse 2 headset
   - BlueMuse installed ([Download BlueMuse](https://github.com/kowalej/BlueMuse/releases))

2. **Client Devices** (Mac, iPhone, Android, etc.):
   - Just need a web browser
   - No BlueMuse or Python required

## Step 1: Install Python Dependencies on Windows

```powershell
cd backend
pip install -r requirements.txt
```

## Step 2: Install LSL on Windows

Download and install LSL from:
- [Lab Streaming Layer Releases](https://github.com/sccn/labstreaminglayer/releases)
- Or use: `pip install pylsl` (may need additional setup)

## Step 3: Find Your Windows Machine's IP Address

### Option A: Using Command Prompt
```cmd
ipconfig
```
Look for `IPv4 Address` under your active network adapter (usually `192.168.x.x` or `10.x.x.x`)

### Option B: Using PowerShell
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```

### Option C: Network Settings
1. Open Settings → Network & Internet
2. Click on your active connection (Wi-Fi or Ethernet)
3. Find "IPv4 address"

**Example IP:** `192.168.1.100`

## Step 4: Configure Backend for Network Access

The backend is already configured to accept network connections (`host="0.0.0.0"`). Just configure:

1. **Windows Firewall** - Allow port 8000:
   ```powershell
   # Run PowerShell as Administrator
   New-NetFirewallRule -DisplayName "NeuroCoach Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```
   
   Or manually:
   - Windows Security → Firewall & network protection → Advanced settings
   - Inbound Rules → New Rule → Port → TCP → 8000 → Allow

2. **Backend CORS** (Optional - for web browser access):
   - The backend allows all origins by default for development
   - For production, set environment variable:
   ```powershell
   $env:ALLOWED_ORIGINS="http://localhost:3000,http://192.168.1.100:3000,http://YOUR_CLIENT_IP:3000"
   ```
   - Or edit `backend/main.py` line 17-20

## Step 5: Start BlueMuse on Windows

1. Connect Muse headset via Bluetooth to Windows machine
2. Open BlueMuse
3. Select your Muse device
4. Click **"Start LSL Stream"**
5. Verify it shows "Streaming" status

## Step 6: Start Backend Server on Windows

**Option A: Using the batch script (easiest)**
```cmd
cd backend
start_windows.bat
```

**Option B: Manual start**
```powershell
cd backend
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
Looking for Muse LSL stream...
```

The backend will automatically connect to BlueMuse's LSL stream once it's detected.

## Step 7: Configure Client Devices

On your Mac, iPhone, or other device:

### For Development (Next.js)

Create `.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws
```
Replace `192.168.1.100` with your Windows machine's IP address.

### For Production/Static Build

Set the environment variable when building or running:
```bash
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws npm run dev
```

### For Mobile/Tablet

If accessing via a web app:
- Use the Windows IP address in the WebSocket URL
- Example: `ws://192.168.1.100:8000/ws`

## Step 8: Connect from Any Device

1. **On Windows**: Ensure backend is running and BlueMuse is streaming
2. **On Client Device**: Open the app/browser
3. The frontend will automatically connect to `ws://YOUR_WINDOWS_IP:8000/ws`

## Troubleshooting

### Backend shows "No Muse LSL stream found"
- Make sure BlueMuse is running and streaming
- Check BlueMuse shows "Streaming" status
- Restart BlueMuse if needed

### Client can't connect to backend
- **Check Windows Firewall**: Ensure port 8000 is allowed
- **Check IP Address**: Verify you're using the correct Windows IP
- **Check Network**: Ensure both devices are on the same network (or use port forwarding for remote access)
- **Test Connection**: Try `curl http://YOUR_WINDOWS_IP:8000` from client device

### Connection works but no data
- Verify BlueMuse is actively streaming
- Check backend logs for LSL connection errors
- Ensure Muse headset is properly connected to Windows via Bluetooth

### For Remote Access (Different Networks)

If client is on a different network:
1. Set up port forwarding on your router (port 8000)
2. Use your public IP address (or use a service like ngrok)
3. **Security Note**: Only do this on trusted networks or use authentication

## Security Considerations

⚠️ **Important**: This setup exposes the backend on your local network. For production:

1. Add authentication to the WebSocket endpoint
2. Use HTTPS/WSS instead of HTTP/WS
3. Implement rate limiting
4. Consider using a VPN for remote access

## Quick Start Summary

**On Windows Machine:**
1. Connect Muse headset via Bluetooth
2. Open BlueMuse → Select device → "Start LSL Stream"
3. Run backend:
   ```cmd
   cd backend
   start_windows.bat
   ```
4. Note your Windows IP address (from `ipconfig`)

**On Client Device (Mac, Phone, etc.):**
1. Create `.env.local`:
   ```env
   NEXT_PUBLIC_WS_URL=ws://YOUR_WINDOWS_IP:8000/ws
   ```
2. Start frontend:
   ```bash
   npm run dev
   ```

That's it! Any device can now connect to your Windows machine's backend and receive real-time EEG data.

## Example Workflow

1. **Windows**: BlueMuse streaming + Backend running on `192.168.1.100:8000`
2. **Mac**: Frontend connects to `ws://192.168.1.100:8000/ws`
3. **Result**: Mac receives real-time EEG data from Muse connected to Windows!

No BlueMuse needed on Mac, no Python needed on Mac - everything runs on Windows!

