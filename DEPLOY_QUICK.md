# ⚡ Deploy Nhanh Lên Render (5 Phút)

## 🎯 Tóm Tắt

Dự án này đã được cấu hình sẵn để deploy **1 service duy nhất** lên Render:
- ✅ Backend + Frontend cùng 1 URL
- ✅ Tự động phát hiện môi trường
- ✅ Hoàn toàn miễn phí
- ✅ Chỉ cần 5 phút!

---

## 📦 Bước 1: Push Lên GitHub (2 phút)

### Cách 1: Dùng Script (Khuyến nghị)

```powershell
.\deploy-to-github.ps1
```

Làm theo hướng dẫn trên màn hình.

### Cách 2: Thủ công

```bash
# Khởi tạo git
git init

# Add files
git add .

# Commit
git commit -m "DrawGuess game - Ready for Render"

# Thêm remote (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push
git branch -M main
git push -u origin main
```

**Lưu ý**: Repository phải là **Public** để dùng Render Free tier!

---

## 🚀 Bước 2: Deploy Trên Render (3 phút)

### 2.1. Tạo Tài Khoản

1. Vào: https://render.com
2. Click **"Get Started"**
3. Chọn **"Sign in with GitHub"**
4. Authorize Render

### 2.2. Deploy Bằng Blueprint

1. Vào Dashboard: https://dashboard.render.com

2. Click **"New +"** → **"Blueprint"**

3. **Connect Repository**:
   - Tìm repo `drawguess-game` (hoặc tên bạn đặt)
   - Click **"Connect"**

4. **Render sẽ tự động**:
   - Đọc file `render.yaml`
   - Tạo service `drawguess-game`
   - Build và deploy

5. **Đợi build** (3-5 phút):
   - Xem progress trong Logs tab
   - Khi thấy "Live" màu xanh → Xong!

6. **Lấy URL**:
   ```
   https://drawguess-game.onrender.com
   ```
   (Hoặc tên service bạn đặt)

---

## ✅ Bước 3: Cấu Hình CORS (30 giây)

**Quan trọng**: Phải làm bước này để game hoạt động!

1. Vào service `drawguess-game`
2. Click tab **"Environment"**
3. Tìm biến `ALLOWED_ORIGINS`
4. Click **"Edit"**
5. Nhập URL của bạn:
   ```
   https://drawguess-game.onrender.com
   ```
6. Click **"Save Changes"**
7. Service sẽ tự động restart

---

## 🎮 Bước 4: Test (1 phút)

### Test API:
```
https://drawguess-game.onrender.com/api
```
Phải thấy:
```json
{
  "status": "ok",
  "message": "DrawGuess Server is running!",
  "version": "1.0.0",
  "environment": "production"
}
```

### Test Health:
```
https://drawguess-game.onrender.com/health
```
Phải thấy:
```json
{
  "status": "healthy"
}
```

### Test Game:
```
https://drawguess-game.onrender.com
```
- Nhập tên
- Click "Quick Play"
- Phải tạo room và chơi được!

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Lần Đầu Truy Cập Chậm
- Render Free tier "ngủ" sau 15 phút không dùng
- Lần đầu wake up mất **30-60 giây**
- Sau đó chạy bình thường

### 2. Giữ Service Awake (Optional)
Dùng **UptimeRobot** (miễn phí):
1. Đăng ký: https://uptimerobot.com
2. Tạo monitor:
   - Type: HTTP(s)
   - URL: `https://drawguess-game.onrender.com/health`
   - Interval: 5 minutes
3. Service sẽ không bao giờ ngủ!

### 3. Xem Logs
```
Dashboard → Service → Logs tab
```
Xem real-time logs để debug.

---

## 🔄 Update Code

Sau khi sửa code:

```bash
git add .
git commit -m "Update game"
git push
```

Render sẽ **tự động deploy lại** trong 2-3 phút!

---

## 🐛 Troubleshooting

### Lỗi "Application failed to respond"
- Kiểm tra Logs tab
- Đảm bảo `PORT=10000` trong Environment

### Lỗi CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
- Kiểm tra `ALLOWED_ORIGINS` có đúng URL không
- Phải có `https://` prefix
- Redeploy sau khi sửa

### WebSocket không kết nối
- Render Free tier **HỖ TRỢ** WebSocket
- Hard refresh: `Ctrl + Shift + R`
- Xem Console log (F12)

### Service ngủ lâu
- Bình thường với Free tier
- Dùng UptimeRobot để keep-alive

---

## 📊 Kiến Trúc Sau Khi Deploy

```
User Browser
    ↓
    ↓ HTTPS (443)
    ↓
Render Server (drawguess-game.onrender.com)
    ↓
    ├─→ Static Files (HTML/CSS/JS)
    ├─→ REST API (/api, /health)
    └─→ WebSocket (Socket.IO /game namespace)
```

**Ưu điểm**:
- ✅ Chỉ 1 service → Tiết kiệm tài nguyên
- ✅ Không cần config CORS phức tạp
- ✅ Same-origin → Bảo mật tốt
- ✅ Dễ quản lý

---

## 📝 Cho Báo Cáo Môn Học

### Các điểm nổi bật:

1. **Giao thức mạng**:
   - HTTP/HTTPS cho static files và API
   - WebSocket cho real-time communication
   - Socket.IO với namespaces

2. **Kiến trúc**:
   - Client-Server model
   - Event-driven architecture
   - Room-based messaging

3. **Deployment**:
   - Cloud hosting (Render)
   - Production environment
   - Environment variables
   - CORS configuration

4. **Network Features**:
   - Real-time bidirectional communication
   - Multiple concurrent connections
   - Low latency (<100ms)
   - Automatic reconnection

---

## ✅ Checklist Deploy

- [ ] Push code lên GitHub (repo Public)
- [ ] Tạo Blueprint trên Render
- [ ] Đợi build xong (status: Live)
- [ ] Cấu hình CORS với URL của service
- [ ] Test API endpoint
- [ ] Test Health endpoint
- [ ] Test game (Quick Play)
- [ ] Test multiplayer (2 tabs/browsers)
- [ ] (Optional) Setup UptimeRobot

---

## 🎉 Xong!

**URL game của bạn**:
```
https://drawguess-game.onrender.com
```

Chia sẻ link này với bạn bè để chơi cùng!

---

**Nếu có vấn đề, xem file `DEPLOY_RENDER.md` để biết chi tiết hơn.**
