# PowerShell script to start both backend and frontend
# Run this script to start the entire application

Write-Host "🚀 Starting Flowstate Application..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found. Please run: python -m venv venv" -ForegroundColor Red
    exit 1
}

# Start backend in a new window
Write-Host "📡 Starting Backend (Python FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; cd backend; python main.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "🎨 Starting Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)." -ForegroundColor Gray
Read-Host

