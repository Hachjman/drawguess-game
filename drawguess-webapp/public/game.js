// public/game.js
(() => {
  console.log('\n=== [GAME.JS] SCRIPT LOADED ===');
  console.log('Current URL:', window.location.href);
  console.log('URL Search:', window.location.search);
  
  // --- CONFIGURATION ---

  const SERVER_URL_NET = 'https://your-drawguess-server.onrender.com'; 

  // Khi deploy, bạn sẽ đổi URL này thành địa chỉ server online của bạn
  const SERVER_URL_LAN_DEFAULT = 'http://localhost:3001';

  function getServerUrl() {
    console.log('\n=== [GAME.JS] GET SERVER URL ===');
    const savedUrl = localStorage.getItem('dg:server_url');
    console.log('Saved URL in localStorage:', savedUrl);
    if (savedUrl) {
      console.log('Using saved URL:', savedUrl);
      return savedUrl;
    }

    // Tự động phát hiện nếu đang ở mạng LAN
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Đề xuất địa chỉ LAN nếu truy cập qua IP nội bộ
    const isLanAccess = window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.');

    let suggestedUrl = SERVER_URL_NET;
    if (isLocalhost) {
        suggestedUrl = SERVER_URL_LAN_DEFAULT;
    } else if (isLanAccess) {
        // Lấy IP từ chính URL đang truy cập, nhưng đổi port thành 3001
        suggestedUrl = `http://${window.location.hostname}:3001`;
    }
    
    const userUrl = prompt(`Enter Server Address:\n(Press OK for suggested)`, suggestedUrl);
    
    const finalUrl = userUrl || suggestedUrl;
    console.log('Final URL selected:', finalUrl);
    localStorage.setItem('dg:server_url', finalUrl);
    return finalUrl;
  }
  
  // Lấy địa chỉ server từ config
  const serverUrl = window.DRAWGUESS_CONFIG ? window.DRAWGUESS_CONFIG.getServerUrl() : getServerUrl();
  console.log('Server URL:', serverUrl);

  // Kết nối đến namespace /game của Server Core
  console.log('Creating socket connection to:', `${serverUrl}/game`);
  const socket = io(`${serverUrl}/game`, {
    reconnectionAttempts: 5,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });

  // Game state
  console.log('\n=== [GAME.JS] LOADING GAME STATE ===');
  const playerName = localStorage.getItem('dg:name') || 'Player';
  const savedAvatarUrl = localStorage.getItem('dg:avatarUrl');
  const playerAvatar = savedAvatarUrl || localStorage.getItem('dg:avatar') || '😀';
  console.log('Player name from localStorage:', playerName);
  console.log('Player avatar from localStorage:', playerAvatar);
  let myPlayerId = null;
  let currentDrawerId = null;
  let isDrawer = false;
  let allPlayers = [];
  
  // UI Elements
  const chatPanel = document.getElementById('chatPanel');
  const palettePanel = document.getElementById('palettePanel');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChat');
  const chatMessages = document.getElementById('chatMessages');
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
  const drawingStatus = document.getElementById('drawingStatus');
  const colorGrid = document.getElementById('colorGrid');
  const brushSizeInput = document.getElementById('brushSize');
  const brushSizeLabel = document.getElementById('brushSizeLabel');
  const wordModal = document.getElementById('wordModal');
  const wordChoices = document.getElementById('wordChoices');
  const wordHint = document.getElementById('wordHint');
  const timerEl = document.getElementById('timer');
  const roundEl = document.getElementById('round');
  const totalRoundsEl = document.getElementById('totalRounds');
  const shareRoomBtn = document.getElementById('shareRoomBtn');
  const playersPanel = document.querySelector('.players-panel');
  const debugWordBtn = document.getElementById('debugWordBtn');
  const podiumModal = document.getElementById('podiumModal');
  const podiumEls = {
    first: { avatar: document.getElementById('p1Avatar'), name: document.getElementById('p1Name'), score: document.getElementById('p1Score') },
    second: { avatar: document.getElementById('p2Avatar'), name: document.getElementById('p2Name'), score: document.getElementById('p2Score') },
    third: { avatar: document.getElementById('p3Avatar'), name: document.getElementById('p3Name'), score: document.getElementById('p3Score') },
  };

  // Drawing state
  let isDrawing = false;
  let currentColor = '#000000';
  let currentTool = 'pen';
  let brushSize = 5;
  let lastX = 0;
  let lastY = 0;

  // --- SOCKET EVENT HANDLERS ---
  
  socket.on('connect', () => {
    myPlayerId = socket.id;
    addSystemMessage(`✅ Connected to server! Joining room...`);
    
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    const password = localStorage.getItem('dg:roomPassword') || '';

    // LOG CHI TIẾT ĐỂ DEBUG
    console.log('=== DEBUG JOIN ROOM ===');
    console.log('roomId from URL:', roomId);
    console.log('playerName (global):', playerName);
    console.log('playerAvatar (global):', playerAvatar);
    console.log('password:', password ? '***' : '(empty)');
    console.log('localStorage dg:name:', localStorage.getItem('dg:name'));
    console.log('localStorage dg:avatar:', localStorage.getItem('dg:avatar'));
    console.log('localStorage dg:roomPassword:', localStorage.getItem('dg:roomPassword'));
    console.log('======================');

    if (!roomId || !playerName) {
        console.error('❌ VALIDATION FAILED!');
        console.error('roomId:', roomId, '| playerName:', playerName);
        alert(`Error: Missing room or player info.\nRoom: ${roomId}\nPlayer: ${playerName}\nReturning to lobby.`);
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Validation passed, emitting join-game...');
    // Gửi sự kiện join-game với thông tin từ biến global
    socket.emit('join-game', { playerName, playerAvatar, roomId, password });

    // Xóa mật khẩu khỏi localStorage sau khi đã sử dụng
    localStorage.removeItem('dg:roomPassword');
  });

  socket.on('join-error', (data) => {
    alert(data.message);
    window.location.href = 'index.html'; 
  });

  socket.on('connect_error', (err) => {
    addSystemMessage(`❌ Connection failed: ${err.message}. Please check server address and refresh.`);
  });

  socket.on('game-state', (data) => {
    allPlayers = data.players;
    currentDrawerId = data.currentDrawer;
    isDrawer = (currentDrawerId === myPlayerId);
    
    updatePlayersList();
    updateRoleUI();
    
    roundEl.textContent = data.round;
    timerEl.textContent = data.timeLeft;
  });

  socket.on('player-joined', (data) => {
    allPlayers = data.players;
    updatePlayersList();
    addSystemMessage(`${data.player.name} has joined the game!`);
  });

  socket.on('player-left', (data) => {
    allPlayers = data.players;
    updatePlayersList();
    addSystemMessage(`${data.playerName} has left the game.`);
  });
  
  // Sự kiện mới từ server tái cấu trúc
  socket.on('choose-word', (data) => {
    console.log('=== [CLIENT] CHOOSE-WORD EVENT ===');
    console.log('isDrawer:', isDrawer);
    console.log('myPlayerId:', myPlayerId);
    console.log('currentDrawerId:', currentDrawerId);
    console.log('Words:', data.words);
    
    // Event choose-word chỉ được gửi đến drawer, nên luôn hiện modal
    // Không cần kiểm tra isDrawer vì server đã filter
    console.log('✅ Showing word selection modal...');
    showWordSelection(data.words);
  });

  socket.on('word-selected', (data) => {
    // Người vẽ thấy từ gốc, không che
    wordHint.textContent = `DRAW THIS: ${data.word}`;
    drawingStatus.textContent = `Your word is: "${data.word}"`;
  });

  socket.on('word-hint', (data) => {
    wordHint.textContent = `GUESS THIS: ${data.hint.split('').join(' ')}`;
    const drawer = allPlayers.find(p => p.id === currentDrawerId);
    drawingStatus.textContent = `${drawer ? drawer.name : 'Someone'} is drawing...`;
    addSystemMessage(`The word has ${data.length} letters. Good luck!`);
  });

  socket.on('next-round', (data) => {
    console.log('\n=== [CLIENT] NEXT-ROUND ===');
    console.log('Data:', data);
    currentDrawerId = data.currentDrawer;
    isDrawer = (myPlayerId === currentDrawerId);
    roundEl.textContent = data.round;
    if (typeof data.maxRounds === 'number') {
      totalRoundsEl.textContent = data.maxRounds;
    }
    
    clearCanvas();
    wordHint.textContent = 'GUESS THIS: _ _ _ _ _';
    
    updateRoleUI();
    updatePlayersList();
    
    addSystemMessage(`🎮 Round ${data.round} has started!`);
    console.log('=== [CLIENT] NEXT-ROUND COMPLETE ===\n');
    // Hide podium if visible
    if (podiumModal) podiumModal.classList.add('hidden');
  });

  socket.on('timer-update', (data) => {
    timerEl.textContent = data.timeLeft;
  });

  socket.on('round-end', (data) => {
    addSystemMessage(`⏰ Time's up! The word was: "${data.word}"`);
    data.scores.forEach(({ id, score }) => {
      const player = allPlayers.find(p => p.id === id);
      if (player) player.score = score;
    });
    updatePlayersList();
    wordHint.textContent = `Word was: ${data.word}`;
  });

  socket.on('game-over', (data) => {
    addSystemMessage('🎉 Game Over!');
    if (!podiumModal) return;
    const standings = Array.isArray(data?.standings) ? data.standings : [];
    // Helper to fill a slot
    function fill(slot, player){
      if (!podiumEls[slot]) return;
      const el = podiumEls[slot];
      if (player){
        const isImg = typeof player.avatar === 'string' && (player.avatar.startsWith('http') || player.avatar.startsWith('data:image'));
        if (isImg) {
          el.avatar.innerHTML = `<img src="${player.avatar}" alt="avatar"/>`;
        } else {
          el.avatar.textContent = player.avatar || '🙂';
        }
        el.name.textContent = player.name || 'Player';
        el.score.textContent = `${player.score || 0} pts`;
      } else {
        el.avatar.textContent = '—';
        el.name.textContent = '—';
        el.score.textContent = '';
      }
    }
    fill('first', standings[0]);
    fill('second', standings[1]);
    fill('third', standings[2]);
    podiumModal.classList.remove('hidden');
  });

  socket.on('draw', (data) => {
    console.log('[CLIENT] Received draw event, isDrawer:', isDrawer);
    if (!isDrawer) {
      console.log('[CLIENT] Drawing remote stroke:', data);
      drawRemote(data);
    }
  });

  socket.on('clear-canvas', () => {
    clearCanvas();
  });

  socket.on('chat-message', (data) => {
    addChatMessage(data.playerName, data.message);
  });

  socket.on('correct-answer', (data) => {
    const player = allPlayers.find(p => p.id === data.playerId);
    if (player) player.score = data.score;
    updatePlayersList();
    addChatMessage('System', `🎉 ${data.playerName} guessed the word! +${data.points} points`, 'correct');
  });

  // --- UI & DRAWING LOGIC (Hầu như giữ nguyên) ---

  function showWordSelection(words) {
    wordChoices.innerHTML = '';
    words.forEach(word => {
      const btn = document.createElement('button');
      btn.className = 'word-choice-btn';
      btn.textContent = word;
      btn.addEventListener('click', () => selectWord(word));
      wordChoices.appendChild(btn);
    });
    wordModal.classList.remove('hidden');
  }

  function selectWord(word) {
    wordModal.classList.add('hidden');
    socket.emit('select-word', { word });
  }

  function setupTools() {
    console.log('[setupTools] Setting up tools...');
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool || 'pen';
        console.log('[setupTools] Tool changed to:', currentTool);
      });
    });
    
    // Brush size
    if (brushSizeInput) {
      brushSizeInput.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        if (brushSizeLabel) brushSizeLabel.textContent = `${brushSize}px`;
      });
    }
  }

  function setupDrawing() {
    console.log('[setupDrawing] Setting up canvas events, canvas:', canvas);
    if (!canvas) {
      console.error('[setupDrawing] Canvas not found!');
      return;
    }
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    console.log('[setupDrawing] Canvas events attached successfully');
  }

  function startDrawing(e) {
    console.log('[startDrawing] isDrawer:', isDrawer);
    if (!isDrawer) {
      console.log('[startDrawing] Not drawer, ignoring');
      return;
    }
    isDrawing = true;
    const { x, y } = getCanvasCoords(e);
    lastX = x;
    lastY = y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    console.log('[startDrawing] Started at', x, y);
  }

  function draw(e) {
    if (!isDrawing || !isDrawer) return;
    const { x, y } = getCanvasCoords(e);
    
    drawLocal(lastX, lastY, x, y, currentColor, brushSize, currentTool);
    
    socket.emit('draw', {
      x0: lastX, y0: lastY, x1: x, y1: y,
      color: currentColor, size: brushSize, tool: currentTool
    });
    
    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
  }
  
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function drawLocal(x0, y0, x1, y1, color, size, tool) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  
  function drawRemote(data) {
    console.log('[CLIENT] drawRemote called with:', data);
    drawLocal(data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function setupPalette() {
    const colorButtons = colorGrid.querySelectorAll('.color-btn');
    colorButtons.forEach((btn, idx) => {
      if (idx === 0) btn.classList.add('active');
      btn.addEventListener('click', () => {
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
        currentTool = 'pen';
        updateToolButtons();
      });
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'clear') {
          clearCanvas();
          socket.emit('clear-canvas');
          return;
        }
        currentTool = tool;
        updateToolButtons();
      });
    });

    brushSizeInput.addEventListener('input', (e) => {
      brushSize = parseInt(e.target.value);
      brushSizeLabel.textContent = brushSize;
    });
  }

  function updateToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === currentTool);
    });
  }

  function setupChat() {
    const sendMessage = () => {
      const msg = chatInput.value.trim();
      if (!msg) return;
      chatInput.value = '';
      socket.emit('chat-message', { message: msg });
    };
    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function addChatMessage(sender, text, type = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${type}`;
    // Basic sanitization
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${sanitizedText}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addSystemMessage(text) {
    addChatMessage('System', text, 'system');
  }

  function updatePlayersList() {
    const sorted = [...allPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
    playersPanel.innerHTML = '';
    sorted.forEach((player, idx) => {
      const div = document.createElement('div');
      div.className = 'player-item';
      if (player.id === currentDrawerId) div.classList.add('active');
      const isImg = typeof player.avatar === 'string' && (player.avatar.startsWith('http') || player.avatar.startsWith('data:image'));
      const avatarHtml = isImg ? `<img src="${player.avatar}" alt="avatar"/>` : `${player.avatar || '🙂'}`;
      div.innerHTML = `
        <span class="rank">#${idx + 1}</span>
        <span class="player-avatar">${avatarHtml}</span>
        <span class="player-name">${player.name}${player.id === myPlayerId ? ' (You)' : ''}</span>
        <span class="player-score">${player.score || 0} pts</span>
      `;
      playersPanel.appendChild(div);
    });
  }

  function updateRoleUI() {
    console.log('[updateRoleUI] isDrawer:', isDrawer, 'myPlayerId:', myPlayerId, 'currentDrawerId:', currentDrawerId);
    
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChat');
    
    if (isDrawer) {
      // Người vẽ: Hiện palette + chat view-only
      console.log('[updateRoleUI] Setting up DRAWER mode');
      palettePanel.style.display = 'flex';
      chatPanel.style.display = 'flex';
      
      // Disable chat input cho người vẽ
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = '🚫 Drawer cannot chat (view only)';
        chatInput.style.opacity = '0.5';
      }
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
      }
      
      canvas.style.cursor = 'crosshair';
      drawingStatus.textContent = 'Waiting to choose a word...';
    } else {
      // Người đoán: Ẩn palette, hiện chat
      console.log('[updateRoleUI] Setting up GUESSER mode');
      chatPanel.style.display = 'flex';
      palettePanel.style.display = 'none';
      
      // Enable chat input
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Type your guess...';
        chatInput.style.opacity = '1';
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
      }
      
      canvas.style.cursor = 'default';
      drawingStatus.textContent = 'Waiting for the drawer...';
    }
  }
  

  // Helper function for copy fallback
  function promptCopyFallback(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert(`Room code copied: ${text}`);
  }

  function init() {
    console.log('[init] Initializing game...');
    addSystemMessage('🔌 Connecting to server...');
    
    // --- SHARE ROOM CODE ---
    if (shareRoomBtn) {
      shareRoomBtn.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        
        if (!roomCode) {
          alert('Room code not found!');
          return;
        }
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(roomCode).then(() => {
            shareRoomBtn.textContent = '✅ Copied!';
            shareRoomBtn.style.background = '#4cd964';
            setTimeout(() => {
              shareRoomBtn.textContent = '📋 Share';
              shareRoomBtn.style.background = '';
            }, 2000);
          }).catch(() => {
            promptCopyFallback(roomCode);
          });
        } else {
          promptCopyFallback(roomCode);
        }
      });
    }

    // --- KHỞI TẠO ---
    console.log('[init] Setting up palette, tools, drawing...');
    setupPalette();
    setupTools();
    setupDrawing();
    setupChat();
    restorePlayerName();
    console.log('[init] Initialization complete!');
  }

  init();
})();