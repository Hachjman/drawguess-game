# 🎨 DrawGuess - Multiplayer Drawing & Guessing Game

A real-time multiplayer game where players take turns drawing and guessing words. Built with Socket.IO, Express, and vanilla JavaScript.

## 🚀 MUỐN DEPLOY NGAY?

**Đọc file này**: [`START_HERE.md`](./START_HERE.md)

Hoặc chạy:
```powershell
.\deploy-to-github.ps1
```

---

## 🌟 Features

- ✅ **Real-time multiplayer** - Play with friends online
- ✅ **Quick Play** - Auto-generated room codes for instant games
- ✅ **Custom Rooms** - Create private rooms with passwords
- ✅ **Room Browser** - Browse and join available games
- ✅ **Share Room Codes** - Easy sharing with copy-to-clipboard
- ✅ **Drawing Tools** - Multiple colors, brush sizes, and eraser
- ✅ **Chat System** - Real-time chat for guessers
- ✅ **Scoring System** - Points based on guess speed
- ✅ **Multiple Rounds** - Configurable game length

## 📁 Project Structure


drawguess-enterprise/
├── drawguess-server/          # Backend (Node.js + Socket.IO)
│   ├── game/                  # Game logic
│   ├── sockets/               # Socket.IO handlers
│   ├── utils/                 # Utilities (word list, room codes)
│   ├── config.js              # Server configuration
│   ├── index.js               # Server entry point
│   └── package.json
│
└── drawguess-webapp/          # Frontend (HTML/CSS/JS)
    └── public/
        ├── index.html         # Lobby page
        ├── game.html          # Game page
        ├── app.js             # Lobby logic
        ├── game.js            # Game logic
        ├── config.js          # Client configuration
        ├── styles.css         # Global styles
        └── game.css           # Game styles


## 🚀 Deployment Guide

### Option 1: Deploy to Render (Backend) + GitHub Pages (Frontend)

#### Step 1: Deploy Backend to Render

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select `drawguess-server` folder
   - Settings:
     - **Name**: `drawguess-server` (or your choice)
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

3. **Add Environment Variables** in Render Dashboard:
   
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourusername.github.io
   

4. **Deploy** and note your Render URL (e.g., `https://drawguess-server.onrender.com`)

#### Step 2: Deploy Frontend to GitHub Pages

1. **Update `config.js`** with your Render URL:
   javascript
   // In drawguess-webapp/public/config.js
   // Change the production URL to your Render URL
   return 'https://your-app-name.onrender.com';
   

2. **Push to GitHub**:
   
   cd drawguess-webapp
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/drawguess.git
   git push -u origin main
   

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/public` (or root if you move files)
   - Save

4. **Access your game** at `https://yourusername.github.io/drawguess`

#### Step 3: Update CORS on Render

Go back to Render dashboard and update `ALLOWED_ORIGINS`:

ALLOWED_ORIGINS=https://yourusername.github.io


### Option 2: Local Development

#### Backend Setup


cd drawguess-server
npm install
cp .env.example .env
npm start


Server runs on `http://localhost:3001`

#### Frontend Setup


cd drawguess-webapp
npx serve public
python -m http.server 3000


Frontend runs on `http://localhost:3000`

## 🎮 How to Play

1. **Enter your name** and choose an avatar
2. **Quick Play** - Join a random game instantly
3. **Or Create Custom Room** - Set room name and password
4. **Share room code** with friends
5. **Draw when it's your turn** - Choose from 3 words
6. **Guess when others draw** - Type in chat
7. **Earn points** - Faster guesses = more points!

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **dotenv** - Environment variables

### Frontend
- **Vanilla JavaScript** - No frameworks
- **Socket.IO Client** - WebSocket client
- **HTML5 Canvas** - Drawing functionality
- **CSS3** - Modern styling

## 📝 Environment Variables

### Server (.env)
env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000


### Client (config.js)
Auto-detects environment. For production, set:
javascript
window.DRAWGUESS_SERVER_URL = 'https://your-render-app.onrender.com';


## 🐛 Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check browser console for specific error messages

### Connection Issues
- Verify server is running (`/health` endpoint)
- Check firewall/network settings
- Try different transports (websocket vs polling)

### Drawing Not Working
- Clear browser cache (Ctrl+Shift+R)
- Check console for JavaScript errors
- Ensure you're the current drawer

## 📄 License

MIT License - feel free to use for your projects!

## 👨‍💻 Author

Created for LTM (Computer Networks) course project

## 🙏 Acknowledgments

- Socket.IO team for excellent real-time library
- Render for free hosting
- GitHub Pages for static hosting
