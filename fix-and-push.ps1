# Script để push fix lên GitHub
Write-Host "🔧 Pushing namespace fix to GitHub..." -ForegroundColor Cyan

git add drawguess-webapp/public/app.js
git commit -m "Fix: Connect to /game namespace in app.js"
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Render sẽ tự động deploy trong 2-3 phút" -ForegroundColor Yellow
    Write-Host "Sau đó refresh browser và thử lại!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ PUSH THẤT BẠI!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
