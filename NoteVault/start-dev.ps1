Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting NoteVault (Backend: 8080 | Frontend: 5173)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Launching Backend on http://localhost:8080..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python main.py"

Write-Host "Launching Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Done! Frontend will be available at http://localhost:5173" -ForegroundColor Yellow
