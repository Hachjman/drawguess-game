document.addEventListener('DOMContentLoaded', () => {
    console.log('\n=== [WEBAPP] APP.JS LOADED ===');
    // --- CẤU HÌNH & KẾT NỐI SOCKET ---
    const serverUrl = window.DRAWGUESS_CONFIG ? window.DRAWGUESS_CONFIG.getServerUrl() : 'http://localhost:3001';
    console.log('Connecting to server:', serverUrl);
    
    const socket = io(serverUrl + '/game', {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
    });
    console.log('Socket created, waiting for connection...');

    // --- LẤY CÁC THÀNH PHẦN GIAO DIỆN (UI ELEMENTS) ---
    const playerNameInput = document.getElementById('playerName');
    const avatarDisplay = document.getElementById('avatarDisplay');
    const prevAvatarBtn = document.getElementById('prevAvatar');
    const nextAvatarBtn = document.getElementById('nextAvatar');
    const roomListEl = document.getElementById('roomList');
    const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
    const quickPlayBtn = document.getElementById('quickPlayBtn');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinByCodeBtn = document.getElementById('joinByCodeBtn');
    const createRoomModal = document.getElementById('createRoomModal');
    const createRoomForm = document.getElementById('createRoomForm');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const newRoomIdInput = document.getElementById('newRoomId');
    const newRoomPassInput = document.getElementById('newRoomPass');
    const newMaxPlayersInput = document.getElementById('newMaxPlayers');
    const newMaxRoundsInput = document.getElementById('newMaxRounds');
    const joinRoomModal = document.getElementById('joinRoomModal');
    const joinRoomForm = document.getElementById('joinRoomForm');
    const closeJoinModalBtn = document.getElementById('closeJoinModalBtn');
    const joinRoomIdInput = document.getElementById('joinRoomId');
    const joinRoomPassInput = document.getElementById('joinRoomPass');

    // --- TRẠNG THÁI (STATE) ---
    const avatars = ['😀', '😎', '🤖', '🐱', '🐼', '👾', '🐸', '🦊', '🧑‍🎨', '🧠'];
    let currentAvatarIndex = 0;
  
    // Build a cute DiceBear avatar URL (fun-emoji). Falls back to initials if name empty.
    function buildDiceBearUrl(name, variantIndex) {
        const seed = `${name || 'Player'}-${variantIndex ?? 0}`;
        const params = new URLSearchParams({
            seed,
            size: '240',
            // Pixel-art style options
            backgroundType: 'gradientLinear',
            // Higher scale gives chunkier pixels visually
            scale: '100'
        });
        // Use pixel-art family to achieve skribbl-like feel
        return `https://api.dicebear.com/7.x/pixel-art/svg?${params.toString()}`;
    }

    // Generate a simple initials avatar (local fallback)
    function generateInitialsAvatar(name) {
        const initials = (name || '?')
          .trim()
          .split(/\s+/)
          .slice(0,2)
          .map(s => s[0] || '')
          .join('')
          .toUpperCase();
        // Color based on hash
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const hue = Math.abs(hash) % 360;
        const bg = `hsl(${hue}, 60%, 28%)`;
        const border = `hsla(${hue}, 65%, 50%, .35)`;
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
  <defs>
    <filter id='s' x='-20%' y='-20%' width='140%' height='140%'>
      <feDropShadow dx='0' dy='6' stdDeviation='8' flood-color='rgba(0,0,0,0.35)'/>
    </filter>
  </defs>
  <rect x='0' y='0' width='240' height='240' rx='24' fill='${bg}' stroke='${border}' stroke-width='3' filter='url(#s)'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='96' font-family='Nunito, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' fill='white' font-weight='800'>${initials}</text>
  <circle cx='200' cy='40' r='6' fill='rgba(255,255,255,.25)'/>
  <circle cx='30' cy='210' r='4' fill='rgba(255,255,255,.18)'/>
  <circle cx='210' cy='200' r='3' fill='rgba(255,255,255,.15)'/>
  <circle cx='20' cy='30' r='3' fill='rgba(255,255,255,.12)'/>
  <rect x='14' y='14' width='212' height='212' rx='20' fill='none' stroke='rgba(255,255,255,.08)'/>
</svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    
    // --- XỬ LÝ SỰ KIỆN SOCKET ---
    socket.on('connect', () => {
        console.log('✅ Connected to lobby server!');
        console.log('Socket ID:', socket.id);
        console.log('Server URL:', serverUrl);
        document.querySelector('.room-item-placeholder').textContent = 'Loading rooms...';
        requestRoomList();
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err);
        roomListEl.innerHTML = '<div class="room-item-placeholder" style="color: #e74c3c; font-weight: bold;">Could not connect to the server. Please check the address and refresh.</div>';
    });

    socket.on('disconnect', (reason) => {
        console.warn('⚠️ Disconnected from server:', reason);
    });

    socket.on('room-list-update', (rooms) => {
        renderRoomList(rooms);
    });

    // --- CÁC HÀM LOGIC ---

    function renderRoomList(rooms) {
        roomListEl.innerHTML = '';
        if (!rooms || rooms.length === 0) {
            roomListEl.innerHTML = '<div class="room-item-placeholder">No active rooms. Why not create one?</div>';
            return;
        }
        rooms.forEach(room => {
            const roomEl = document.createElement('div');
            roomEl.className = 'room-item';
            roomEl.dataset.roomId = room.roomId;
            roomEl.innerHTML = `
                <span class="room-name">${room.roomId} ${room.hasPassword ? '🔒' : ''}</span>
                <span class="room-players">${room.playerCount} players</span>
            `;
            roomEl.addEventListener('click', () => handleJoinRoom(room));
            roomListEl.appendChild(roomEl);
        });
    }

    function handleJoinRoom(room) {
        console.log('\n=== [WEBAPP] JOINING ROOM ===');
        console.log('Room:', room);
        // SỬA LỖI: Luôn kiểm tra và lưu thông tin trước khi hành động
        if (!validateAndSavePlayerInfo()) return;

        let password = '';
        if (room.hasPassword) {
            password = prompt(`Enter password for room "${room.roomId}":`);
            if (password === null) return;
        }
        
        localStorage.setItem('dg:roomPassword', password);
        const gameUrl = `game?room=${room.roomId}`;
        console.log('Redirecting to:', gameUrl);
        console.log('localStorage dg:name:', localStorage.getItem('dg:name'));
        console.log('localStorage dg:avatar:', localStorage.getItem('dg:avatar'));
        console.log('localStorage dg:roomPassword:', password ? '***' : '(empty)');
        window.location.href = gameUrl;
    }

    function requestRoomList() {
        socket.emit('get-room-list', (rooms) => {
            if (rooms) {
                renderRoomList(rooms);
            }
        });
    }

    function handleCreateRoom(e) {
        e.preventDefault();
        // SỬA LỖI: Luôn kiểm tra và lưu thông tin trước khi gửi yêu cầu
        if (!validateAndSavePlayerInfo()) return;

        const newRoomId = newRoomIdInput.value.trim();
        const newRoomPass = newRoomPassInput.value.trim();
        const maxPlayersVal = parseInt((newMaxPlayersInput && newMaxPlayersInput.value) || '0', 10);
        const maxRoundsVal = parseInt((newMaxRoundsInput && newMaxRoundsInput.value) || '0', 10);

        if (!newRoomId) {
            alert('Please enter a room name.');
            return;
        }
        
        // Lấy thông tin người chơi sau khi đã chắc chắn nó được lưu
        const playerData = getPlayerInfo();

        console.log('=== CREATING ROOM ===');
        console.log('playerName:', playerData.name);
        console.log('playerAvatar:', playerData.avatar);
        console.log('roomId:', newRoomId);
        console.log('password:', newRoomPass ? '***' : '(empty)');
        
        socket.emit('lobby:create-room', {
            playerName: playerData.name,
            playerAvatar: playerData.avatar,
            roomId: newRoomId,
            password: newRoomPass,
            maxPlayers: Number.isFinite(maxPlayersVal) && maxPlayersVal >= 2 ? maxPlayersVal : undefined,
            maxRounds: Number.isFinite(maxRoundsVal) && maxRoundsVal >= 1 ? maxRoundsVal : undefined
        }, (response) => {
            console.log('=== CREATE ROOM RESPONSE ===');
            console.log('response:', response);
            
            if (response && response.success) {
                console.log('✅ Room created successfully:', response.roomId);
                localStorage.setItem('dg:roomPassword', newRoomPass);
                const gameUrl = `game?room=${response.roomId}`;
                console.log('Redirecting to:', gameUrl);
                window.location.href = gameUrl;
            } else {
                console.error('❌ Failed to create room:', response);
                alert(`Error: ${response ? response.message : 'No response from server'}`);
            }
        });
    }

    function getPlayerInfo() {
        return {
            name: localStorage.getItem('dg:name'),
            avatar: localStorage.getItem('dg:avatar'),
        };
    }

    // SỬA LỖI: Đổi tên hàm để rõ ràng hơn và đảm bảo nó luôn lưu cả tên và avatar
    function validateAndSavePlayerInfo() {
        const name = playerNameInput.value.trim();
        console.log('\n=== [WEBAPP] VALIDATE PLAYER INFO ===');
        console.log('Player name input:', name);
        console.log('Current avatar index:', currentAvatarIndex);
        console.log('Current avatar:', avatars[currentAvatarIndex]);
        
        if (!name) {
            console.log('❌ Validation failed: No name entered');
            alert('Please enter your name before joining or creating a room!');
            playerNameInput.focus();
            return false;
        }
        localStorage.setItem('dg:name', name);
        // Save cute DiceBear avatar URL; fallback to initials on failure paths
        const url = buildDiceBearUrl(name, currentAvatarIndex);
        localStorage.setItem('dg:avatarUrl', url);
        localStorage.setItem('dg:avatar', avatars[currentAvatarIndex]); // keep legacy value for fallback
        console.log('✅ Player info saved to localStorage');
        console.log('Saved name:', localStorage.getItem('dg:name'));
        console.log('Saved avatarUrl:', localStorage.getItem('dg:avatarUrl'));
        return true;
    }

    function renderAvatar() {
        const name = playerNameInput.value.trim();
        const url = buildDiceBearUrl(name || 'Player', currentAvatarIndex);
        localStorage.setItem('dg:avatarUrl', url);
        avatarDisplay.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Avatar';
        avatarDisplay.appendChild(img);
    }
    
    function restorePlayerInfo() {
        const savedName = localStorage.getItem('dg:name');
        if (savedName) {
            playerNameInput.value = savedName;
        }
        // Always regenerate initials avatar for current name
        renderAvatar();
    }

    function openCreateRoomModal() {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name first!');
            playerNameInput.focus();
            return;
        }
        createRoomModal.classList.remove('hidden');
    }

    function closeCreateRoomModal() {
        createRoomModal.classList.add('hidden');
    }

    function openJoinRoomModal() {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name first!');
            playerNameInput.focus();
            return;
        }
        joinRoomModal.classList.remove('hidden');
        setTimeout(() => joinRoomIdInput && joinRoomIdInput.focus(), 0);
    }

    function closeJoinRoomModal() {
        joinRoomModal.classList.add('hidden');
    }

    function handleJoinByCode(e) {
        e.preventDefault();
        if (!validateAndSavePlayerInfo()) return;
        const rawCode = (joinRoomIdInput.value || '').trim();
        if (!rawCode) {
            alert('Please enter a room code.');
            joinRoomIdInput.focus();
            return;
        }
        const roomCode = rawCode.toUpperCase();
        const pass = (joinRoomPassInput.value || '').trim();
        localStorage.setItem('dg:roomPassword', pass);
        const gameUrl = `game?room=${encodeURIComponent(roomCode)}`;
        window.location.href = gameUrl;
    }

    function handleQuickPlay() {
        console.log('\n=== [WEBAPP] QUICK PLAY ===');
        if (!validateAndSavePlayerInfo()) return;
        
        const playerData = getPlayerInfo();
        quickPlayBtn.disabled = true;
        quickPlayBtn.textContent = '⏳ Creating room...';
        
        socket.emit('lobby:quick-play', {
            playerName: playerData.name,
            playerAvatar: playerData.avatar
        }, (response) => {
            quickPlayBtn.disabled = false;
            quickPlayBtn.textContent = '🎮 Quick Play';
            
            if (response && response.success) {
                console.log('✅ Quick Play room created:', response.roomId);
                localStorage.setItem('dg:roomPassword', '');
                const gameUrl = `game?room=${response.roomId}`;
                console.log('Redirecting to:', gameUrl);
                window.location.href = gameUrl;
            } else {
                console.error('❌ Quick Play failed:', response);
                alert(`Error: ${response ? response.message : 'No response from server'}`);
            }
        });
    }

    // --- GẮN CÁC SỰ KIỆN VÀO GIAO DIỆN ---
    prevAvatarBtn.addEventListener('click', () => {
        currentAvatarIndex = (currentAvatarIndex - 1 + avatars.length) % avatars.length;
        renderAvatar();
    });

    nextAvatarBtn.addEventListener('click', () => {
        currentAvatarIndex = (currentAvatarIndex + 1) % avatars.length;
        renderAvatar();
    });

    refreshRoomsBtn.addEventListener('click', requestRoomList);
    quickPlayBtn.addEventListener('click', handleQuickPlay);
    createRoomBtn.addEventListener('click', openCreateRoomModal);
    closeModalBtn.addEventListener('click', closeCreateRoomModal);
    createRoomForm.addEventListener('submit', handleCreateRoom);
    if (joinByCodeBtn) joinByCodeBtn.addEventListener('click', openJoinRoomModal);
    if (closeJoinModalBtn) closeJoinModalBtn.addEventListener('click', closeJoinRoomModal);
    if (joinRoomForm) joinRoomForm.addEventListener('submit', handleJoinByCode);

    // --- KHỞI TẠO ---
    restorePlayerInfo();
});