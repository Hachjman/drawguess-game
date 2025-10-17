# Script Deploy lên GitHub
Write-Host "🚀 DrawGuess - Deploy to GitHub" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Tải Git tại: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Git đã được cài đặt" -ForegroundColor Green
Write-Host ""

# Nhập thông tin
Write-Host "Nhập thông tin GitHub:" -ForegroundColor Cyan
$username = Read-Host "GitHub username"
$reponame = Read-Host "Repository name (ví dụ: drawguess-game)"

Write-Host ""
Write-Host "Sẽ push lên: https://github.com/$username/$reponame" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Tiếp tục? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Đã hủy." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔧 Bắt đầu..." -ForegroundColor Cyan

# Khởi tạo git
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
}

# Add files
Write-Host ""
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "DrawGuess game - Ready for Render deployment"

# Set branch
Write-Host ""
Write-Host "Setting branch to main..." -ForegroundColor Yellow
git branch -M main

# Add remote
Write-Host ""
Write-Host "Adding remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://github.com/$username/$reponame.git"

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Bạn có thể cần đăng nhập GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Bước tiếp theo:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Mở https://dashboard.render.com" -ForegroundColor White
    Write-Host "2. Click 'New +' → 'Blueprint'" -ForegroundColor White
    Write-Host "3. Chọn repo: $username/$reponame" -ForegroundColor White
    Write-Host "4. Click 'Apply'" -ForegroundColor White
    Write-Host "5. Đợi 3-5 phút để build" -ForegroundColor White
    Write-Host "6. Lấy URL và test!" -ForegroundColor White
    Write-Host ""
    Write-Host "Chi tiết: Xem file DEPLOY_RENDER.md" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ PUSH THẤT BẠI!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "1. Repository chưa tồn tại - Tạo tại: https://github.com/new" -ForegroundColor White
    Write-Host "2. Chưa đăng nhập GitHub" -ForegroundColor White
    Write-Host "3. Không có quyền truy cập" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
