# Script Deploy DrawGuess lên GitHub
# Repo: https://github.com/Amin7410/Game.git

Write-Host ""
Write-Host "🚀 DrawGuess - Deploy to GitHub" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Repo: https://github.com/Amin7410/Game.git" -ForegroundColor Yellow
Write-Host ""

# Kiểm tra git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Tải Git tại: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Git đã được cài đặt" -ForegroundColor Green
Write-Host ""

# Xác nhận
Write-Host "Sẽ push code lên: https://github.com/Amin7410/Game.git" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Tiếp tục? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Đã hủy." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔧 Bắt đầu deploy..." -ForegroundColor Cyan
Write-Host ""

# Khởi tạo git (nếu chưa có)
if (-not (Test-Path ".git")) {
    Write-Host "[1/6] Initializing Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "[1/6] Git already initialized" -ForegroundColor Green
}

Write-Host ""

# Add files
Write-Host "[2/6] Adding files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

Write-Host ""

# Commit
Write-Host "[3/6] Committing changes..." -ForegroundColor Yellow
$commitMsg = "Fix socket namespace and deploy to Render"
git commit -m "$commitMsg"
Write-Host "✅ Changes committed" -ForegroundColor Green

Write-Host ""

# Set branch
Write-Host "[4/6] Setting branch to main..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branch set to main" -ForegroundColor Green

Write-Host ""

# Add/Update remote
Write-Host "[5/6] Configuring remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://github.com/Amin7410/Game.git"
Write-Host "✅ Remote configured" -ForegroundColor Green

Write-Host ""

# Push
Write-Host "[6/6] Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Bạn có thể cần đăng nhập GitHub..." -ForegroundColor Cyan
Write-Host ""

git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Bước tiếp theo - Deploy trên Render:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Mở: https://dashboard.render.com" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Click 'New +' → 'Blueprint'" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Connect Repository:" -ForegroundColor White
    Write-Host "   - Chọn: Amin7410/Game" -ForegroundColor Yellow
    Write-Host "   - Click 'Connect'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Render sẽ tự động:" -ForegroundColor White
    Write-Host "   - Đọc file render.yaml" -ForegroundColor Gray
    Write-Host "   - Tạo service 'drawguess-game'" -ForegroundColor Gray
    Write-Host "   - Build và deploy (3-5 phút)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Sau khi deploy xong (status: Live):" -ForegroundColor White
    Write-Host "   - Vào service → Environment tab" -ForegroundColor Yellow
    Write-Host "   - Sửa ALLOWED_ORIGINS = URL của service" -ForegroundColor Yellow
    Write-Host "   - Ví dụ: https://drawguess-game.onrender.com" -ForegroundColor Gray
    Write-Host "   - Click Save Changes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "6. Test game:" -ForegroundColor White
    Write-Host "   - Mở URL của service" -ForegroundColor Yellow
    Write-Host "   - Nhập tên → Quick Play" -ForegroundColor Yellow
    Write-Host "   - Chơi thử!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📚 Chi tiết: Xem file DEPLOY_QUICK.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 URL game sau khi deploy:" -ForegroundColor Green
    Write-Host "   https://drawguess-game.onrender.com" -ForegroundColor Yellow
    Write-Host "   (hoặc tên service bạn đặt)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ PUSH THẤT BẠI!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "1. Chưa đăng nhập GitHub" -ForegroundColor White
    Write-Host "2. Không có quyền truy cập repo" -ForegroundColor White
    Write-Host "3. Lỗi kết nối mạng" -ForegroundColor White
    Write-Host ""
    Write-Host "Giải pháp:" -ForegroundColor Yellow
    Write-Host "- Đăng nhập GitHub trong Git Bash" -ForegroundColor White
    Write-Host "- Hoặc dùng Personal Access Token" -ForegroundColor White
    Write-Host "- Xem: https://docs.github.com/en/authentication" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
