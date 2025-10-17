# 🚀 Hướng Dẫn Deploy DrawGuess Lên Render

## 📦 Repo của bạn
```
https://github.com/Amin7410/Game.git
```

---

## ⚡ DEPLOY NGAY (5 PHÚT)

### **Bước 1: Push Code Lên GitHub**

Mở PowerShell tại thư mục dự án và chạy:

```powershell
.\deploy-now.ps1
```

Script sẽ tự động:
- ✅ Add tất cả files
- ✅ Commit với message
- ✅ Push lên `https://github.com/Amin7410/Game.git`
- ✅ Hiển thị bước tiếp theo

**Lưu ý**: Bạn có thể cần đăng nhập GitHub khi push.

---

### **Bước 2: Deploy Trên Render**

#### 2.1. Đăng nhập Render

1. Vào: https://render.com
2. Click **"Get Started"**
3. Chọn **"Sign in with GitHub"**
4. Authorize Render

#### 2.2. Tạo Service Từ Blueprint

1. Vào Dashboard: https://dashboard.render.com

2. Click **"New +"** → **"Blueprint"**

3. **Connect Repository**:
   - Tìm và chọn: **`Amin7410/Game`**
   - Click **"Connect"**

4. **Render sẽ tự động**:
   - Đọc file `render.yaml`
   - Tạo service `drawguess-game`
   - Build code (3-5 phút)
   - Deploy

5. **Đợi build xong**:
   - Xem progress trong **Logs** tab
   - Khi thấy status **"Live"** (màu xanh) → Xong!

6. **Lấy URL**:
   ```
   https://drawguess-game.onrender.com
   ```
   (Hoặc tên service bạn đặt)

---

### **Bước 3: Cấu Hình CORS**

**Quan trọng**: Phải làm bước này để game hoạt động!

1. Click vào service **`drawguess-game`**

2. Vào tab **"Environment"**

3. Tìm biến **`ALLOWED_ORIGINS`**

4. Click **"Edit"** (icon bút chì)

5. Nhập URL của service:
   ```
   https://drawguess-game.onrender.com
   ```
   (Thay bằng URL thực tế của bạn)

6. Click **"Save Changes"**

7. Service sẽ tự động **restart** (30 giây)

---

### **Bước 4: Test Game**

#### Test API:
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

#### Test Health:
```
https://drawguess-game.onrender.com/health
```

Phải thấy:
```json
{
  "status": "healthy"
}
```

#### Test Game:
```
https://drawguess-game.onrender.com
```

1. Nhập tên
2. Click **"Quick Play"**
3. Phải tạo room và chơi được!

---

## 🎮 Sử Dụng

### Chơi 1 Mình (Test):
1. Mở game
2. Quick Play
3. Mở tab mới (Incognito)
4. Join room bằng code

### Chơi Với Bạn Bè:
1. Tạo room (Create Room)
2. Copy room code
3. Gửi code cho bạn bè
4. Họ vào game → Join room

### Share Link:
```
https://drawguess-game.onrender.com
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Lần Đầu Truy Cập Chậm
- Render Free tier **ngủ** sau 15 phút không dùng
- Lần đầu wake up mất **30-60 giây**
- Sau đó chạy bình thường

**Giải pháp**: Đợi 1 phút rồi refresh

### 2. Keep Service Awake (Optional)

Dùng **UptimeRobot** (miễn phí):

1. Đăng ký: https://uptimerobot.com

2. Tạo monitor mới:
   - **Type**: HTTP(s)
   - **URL**: `https://drawguess-game.onrender.com/health`
   - **Interval**: 5 minutes

3. Service sẽ không bao giờ ngủ!

### 3. Update Code

Sau khi sửa code:

```powershell
.\deploy-now.ps1
```

Render sẽ **tự động deploy lại** trong 2-3 phút!

---

## 🐛 Troubleshooting

### Lỗi: "Application failed to respond"

**Nguyên nhân**: Service đang wake up

**Giải pháp**:
- Đợi 30-60 giây
- Refresh lại trang
- Kiểm tra Logs tab

### Lỗi CORS:

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Nguyên nhân**: Chưa cấu hình `ALLOWED_ORIGINS`

**Giải pháp**:
1. Vào Environment tab
2. Sửa `ALLOWED_ORIGINS` = URL của service
3. Phải có `https://` prefix
4. Save Changes

### Lỗi: "Failed to connect to server"

**Nguyên nhân**: WebSocket không kết nối

**Giải pháp**:
- Hard refresh: `Ctrl + Shift + R`
- Xóa cache browser
- Thử browser khác
- Kiểm tra Console (F12)

### Build Failed

**Giải pháp**:
1. Xem **Logs** tab để biết lỗi cụ thể
2. Kiểm tra `package.json` có đúng không
3. Đảm bảo `node_modules` không được push (có `.gitignore`)

---

## 📊 Kiến Trúc Sau Khi Deploy

```
┌─────────────────────────────────────┐
│   User Browser                      │
│   https://drawguess-game            │
│   .onrender.com                     │
└──────────────┬──────────────────────┘
               │
               │ HTTPS (443)
               │ WebSocket
               │
┌──────────────▼──────────────────────┐
│   Render Server                     │
│   (Singapore Region)                │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Express.js                 │  │
│   │  - Serve static files       │  │
│   │  - REST API                 │  │
│   │  - Socket.IO Server         │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Socket.IO Namespaces       │  │
│   │  - /game (game logic)       │  │
│   │  - /admin (admin panel)     │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Protocols:**
- HTTP/HTTPS: Static files, API
- WebSocket: Real-time communication
- Socket.IO: Event-driven messaging

---

## 💰 Chi Phí

**$0 - HOÀN TOÀN MIỄN PHÍ!**

Render Free Tier:
- ✅ 750 giờ/tháng
- ✅ 100GB bandwidth
- ✅ WebSocket support
- ✅ Auto SSL (HTTPS)
- ⚠️ Sleep sau 15 phút

---

## 🎓 Cho Báo Cáo Môn Học

### Điểm nổi bật:

**1. Giao thức mạng:**
- HTTP/HTTPS cho static content
- WebSocket cho real-time communication
- Socket.IO với automatic fallback (polling)

**2. Kiến trúc:**
- Client-Server model
- Event-driven architecture
- Namespace-based routing (`/game`, `/admin`)
- Room-based messaging (broadcast)

**3. Network concepts:**
- CORS (Cross-Origin Resource Sharing)
- WebSocket handshake và upgrade
- Persistent connections
- Bidirectional communication
- Low latency (<100ms trong cùng region)

**4. Production deployment:**
- Cloud hosting (Render)
- Environment variables
- Health checks
- Auto-scaling
- HTTPS/SSL certificates

**5. Socket.IO Features:**
- Namespaces
- Rooms
- Events
- Acknowledgements
- Reconnection logic

---

## 📝 Checklist Deploy

### Trước khi deploy:
- [x] Code đã được sửa (socket namespace)
- [x] Đã test local
- [x] Có tài khoản GitHub
- [x] Có tài khoản Render
- [x] Repo: `https://github.com/Amin7410/Game.git`

### Trong quá trình deploy:
- [ ] Chạy `.\deploy-now.ps1`
- [ ] Push thành công lên GitHub
- [ ] Tạo Blueprint trên Render
- [ ] Chọn repo `Amin7410/Game`
- [ ] Build thành công (status: Live)
- [ ] Cấu hình CORS với URL của service

### Sau khi deploy:
- [ ] Test `/api` endpoint
- [ ] Test `/health` endpoint
- [ ] Test trang chủ load được
- [ ] Test Quick Play
- [ ] Test Create Room
- [ ] Test Join Room
- [ ] Test vẽ đồng bộ (2 tabs)
- [ ] Test chat
- [ ] (Optional) Setup UptimeRobot

---

## ✅ Tóm Tắt Lệnh

```powershell
# Deploy lên GitHub
.\deploy-now.ps1

# Update code sau này
.\deploy-now.ps1
```

Sau đó làm theo hướng dẫn trên Render Dashboard.

---

## 🎉 Kết Quả

**URL game của bạn**:
```
https://drawguess-game.onrender.com
```

Chia sẻ link này với bạn bè để chơi cùng!

---

## 📞 Cần Giúp?

- **Xem Logs**: Dashboard → Service → Logs tab
- **Console Log**: F12 trong browser
- **File hướng dẫn**: `DEPLOY_QUICK.md`, `BUGS_FIXED.md`

---

**CHÚC BẠN DEPLOY THÀNH CÔNG! 🚀**
