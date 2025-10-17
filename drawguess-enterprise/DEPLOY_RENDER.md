# 🚀 Hướng dẫn Deploy lên Render (Miễn phí)

## ✅ Đã chuẩn bị sẵn

Dự án đã được cấu hình để deploy lên Render với:
- ✅ Backend + Frontend cùng 1 service (tiết kiệm tài nguyên)
- ✅ Tự động phát hiện môi trường (dev/production)
- ✅ Hoàn toàn miễn phí (Render Free tier)
- ✅ Phù hợp môn Lập trình mạng (Socket.IO, WebSocket, HTTP)

## 📋 Các bước Deploy

### Bước 1: Tạo tài khoản Render

1. Truy cập: https://render.com
2. Đăng ký bằng GitHub account
3. Authorize Render truy cập GitHub repos

### Bước 2: Push code lên GitHub

```bash
# Di chuyển vào thư mục dự án
cd c:\Users\minhd\source\gameQ\Game

# Khởi tạo git (nếu chưa có)
git init

# Add tất cả files
git add .

# Commit
git commit -m "Setup DrawGuess game for Render deployment"

# Tạo repo mới trên GitHub và push
git remote add origin https://github.com/YOUR_USERNAME/drawguess-game.git
git branch -M main
git push -u origin main
```

### Bước 3: Deploy trên Render

1. **Vào Render Dashboard**: https://dashboard.render.com

2. **Chọn "New +" → "Blueprint"**

3. **Connect Repository**:
   - Chọn repo `drawguess-game` vừa push
   - Click "Connect"

4. **Render sẽ tự động đọc file `render.yaml`** và tạo service

5. **Đợi build hoàn thành** (3-5 phút)

6. **Lấy URL**: Sau khi deploy xong, bạn sẽ có URL dạng:
   ```
   https://drawguess-game.onrender.com
   ```

### Bước 4: Cấu hình CORS (Quan trọng!)

1. Vào **Dashboard** → Chọn service `drawguess-game`

2. Vào **Environment** tab

3. Thêm/Sửa biến `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://drawguess-game.onrender.com
   ```
   *(Thay `drawguess-game` bằng tên service của bạn)*

4. Click **Save Changes** → Service sẽ tự động restart

## 🎮 Sử dụng

Sau khi deploy xong, truy cập:
```
https://drawguess-game.onrender.com
```

**Lưu ý**: Lần đầu truy cập có thể mất 30-60 giây vì Render Free tier "ngủ" khi không dùng.

## 🔍 Kiểm tra

### Test API:
```
https://drawguess-game.onrender.com/api
```
Phải trả về JSON:
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
Phải trả về:
```json
{
  "status": "healthy"
}
```

## 📊 Giải thích cho môn Lập trình mạng

### Kiến trúc mạng:
```
Client (Browser)
    ↓ HTTP/HTTPS
    ↓ WebSocket (Socket.IO)
    ↓
Render Server (Node.js + Express)
    ↓
Socket.IO Namespaces:
    - /game (game logic)
    - /admin (admin panel)
```

### Protocols sử dụng:
- **HTTP/HTTPS**: Serve static files, REST API
- **WebSocket**: Real-time bidirectional communication
- **Socket.IO**: WebSocket wrapper với fallback (polling)

### Network Features:
- ✅ **Real-time communication** (WebSocket)
- ✅ **Client-Server architecture**
- ✅ **CORS handling** (Cross-Origin Resource Sharing)
- ✅ **Multiple namespaces** (routing)
- ✅ **Event-driven communication**
- ✅ **Room-based messaging** (broadcast)

## 🐛 Troubleshooting

### Lỗi "Application failed to respond"
- Kiểm tra logs: Dashboard → Logs tab
- Đảm bảo `PORT` env var = `10000`

### Lỗi CORS
- Kiểm tra `ALLOWED_ORIGINS` có đúng URL không
- Phải có `https://` prefix

### WebSocket không kết nối
- Render Free tier hỗ trợ WebSocket
- Kiểm tra browser console có lỗi không
- Thử hard refresh (Ctrl+Shift+R)

### Service "ngủ" lâu
- Render Free tier ngủ sau 15 phút không dùng
- Lần đầu wake up mất 30-60 giây
- Giải pháp: Dùng UptimeRobot ping mỗi 5 phút (miễn phí)

## 💡 Tips

### Keep service awake (Optional):
1. Đăng ký UptimeRobot: https://uptimerobot.com
2. Tạo monitor mới:
   - Type: HTTP(s)
   - URL: `https://drawguess-game.onrender.com/health`
   - Interval: 5 minutes

### View logs:
```
Dashboard → Service → Logs tab
```

### Update code:
```bash
git add .
git commit -m "Update game"
git push
```
Render tự động deploy lại!

## 📝 Báo cáo môn học

Khi làm báo cáo, nhấn mạnh:

1. **Kiến trúc Client-Server**
   - Mô tả luồng dữ liệu
   - Giải thích WebSocket vs HTTP

2. **Socket.IO Implementation**
   - Namespaces (/game, /admin)
   - Room management
   - Event handling

3. **Network Protocols**
   - HTTP cho static files
   - WebSocket cho real-time
   - CORS configuration

4. **Deployment**
   - Cloud hosting (Render)
   - Environment configuration
   - Production best practices

## 🎓 Tài liệu tham khảo

- Socket.IO: https://socket.io/docs/v4/
- Render Docs: https://render.com/docs
- WebSocket Protocol: https://datatracker.ietf.org/doc/html/rfc6455

---

**Chúc bạn deploy thành công! 🎉**

Nếu có vấn đề, check logs trên Render Dashboard.
