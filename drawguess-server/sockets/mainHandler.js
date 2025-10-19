const GameRoom = require('../game/GameRoom');
const { getRandomWords } = require('../utils/wordList');
const { generateUniqueRoomCode, isValidRoomCode } = require('../utils/roomCodeGenerator');
const config = require('../config');

// Trạng thái (State) của toàn bộ server được quản lý ở đây
const rooms = new Map();
const players = new Map();

module.exports = function(gameNamespace) {
  
  // Determine recommended number of rounds based on player count
  function getRecommendedRounds(playerCount){
    if (playerCount <= 1) return 1;
    if (playerCount === 2) return 3;
    if (playerCount === 3) return 4;
    if (playerCount === 4) return 5;
    return 6; // 5 or more players
  }
  
  /**
   * Gửi danh sách phòng đã cập nhật đến tất cả client trong lobby.
   */
  function broadcastRoomListUpdate() {
    const roomList = Array.from(rooms.values()).map(room => room.getPublicInfo());
    gameNamespace.emit('room-list-update', roomList);
  }

  // Middleware: Chạy trước mỗi sự kiện để kiểm tra và bảo mật
  gameNamespace.use((socket, next) => {
    // Rate Limiting: Chống spam sự kiện từ một client
    const player = players.get(socket.id);
    if (player && player.events) {
      const now = Date.now();
      // Đếm số sự kiện trong 1 giây vừa qua
      const eventCount = player.events.filter(t => now - t < 1000).length;
      
      if (eventCount > config.RATE_LIMIT_EVENTS_PER_SECOND) {
        console.warn(`[SECURITY] Player ${socket.id} is sending events too fast!`);
        return next(new Error('Rate limit exceeded'));
      }
      
      player.events.push(now);
      // Giữ cho mảng events không quá lớn
      if (player.events.length > config.RATE_LIMIT_EVENTS_PER_SECOND * 2) {
          player.events.shift();
      }
    }
    next();
  });

  // Xử lý khi có một client mới kết nối vào namespace /game
  gameNamespace.on('connection', (socket) => {
    console.log(`\n=== [SERVER] NEW CONNECTION ===`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Total connections: ${gameNamespace.sockets.size}`);
    console.log(`Active rooms: ${rooms.size}`);
    console.log('================================\n');

    // --- SỰ KIỆN DÀNH CHO LOBBY ---

    socket.on('get-room-list', (callback) => {
        const roomList = Array.from(rooms.values()).map(room => room.getPublicInfo());
        if (typeof callback === 'function') {
            callback(roomList);
        }
    });

    // Quick Play: Tạo phòng tự động với room code
    socket.on('lobby:quick-play', (data, callback) => {
        console.log('\n=== [SERVER] QUICK-PLAY EVENT ===');
        const { playerName, playerAvatar } = data;
        
        if (!playerName) {
            return callback({ success: false, message: 'Player name required.' });
        }
        
        const roomCode = generateUniqueRoomCode(rooms);
        const broadcast = (event, data) => gameNamespace.to(roomCode).emit(event, data);
        const newRoom = new GameRoom(roomCode, broadcast, {
            roomType: 'public',
            createdBy: playerName,
            maxPlayers: 5, // Quick play has max 5 players
            maxRounds: 3,  // Start with 3 rounds, will adjust based on player count
            roundTime: 60  // 60 seconds per round
        });
        rooms.set(roomCode, newRoom);
        
        console.log(`✅ Quick Play room '${roomCode}' created by ${playerName}`);
        broadcastRoomListUpdate();
        callback({ success: true, roomId: roomCode });
    });

    // Create Custom Room: Tạo phòng tùy chỉnh
    socket.on('lobby:create-room', (data, callback) => {
        console.log('\n=== [SERVER] LOBBY:CREATE-ROOM EVENT ===');
        console.log('Socket ID:', socket.id);
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        const { playerName, playerAvatar, roomId, password, roomType, customName, maxPlayers, maxRounds, roundTime } = data;

        // Validation
        if (!playerName) {
            console.log('❌ Validation failed: No player name');
            return callback({ success: false, message: 'Player name required.' });
        }
        
        // Nếu không có roomId, auto-generate
        let finalRoomId = roomId;
        if (!finalRoomId || finalRoomId.trim() === '') {
            finalRoomId = generateUniqueRoomCode(rooms);
        } else {
            // Validate custom room ID
            finalRoomId = finalRoomId.toUpperCase().trim();
            if (!isValidRoomCode(finalRoomId)) {
                return callback({ success: false, message: 'Invalid room code format. Use 4-10 alphanumeric characters.' });
            }
            if (rooms.has(finalRoomId)) {
                return callback({ success: false, message: 'Room code already exists. Try another one.' });
            }
        }

        const broadcast = (event, data) => gameNamespace.to(finalRoomId).emit(event, data);
        const newRoom = new GameRoom(finalRoomId, broadcast, {
            password: password || null,
            roomType: roomType || 'custom',
            customName: customName || null,
            createdBy: playerName,
            maxPlayers: Math.min(maxPlayers || 8, 8), // Cap at 8 players for custom rooms
            maxRounds: maxRounds || 3, // Default to 3 rounds, will adjust based on player count
            roundTime: roundTime || config.ROUND_TIME,
        });
        rooms.set(finalRoomId, newRoom);

        console.log(`✅ [CREATE ROOM] '${finalRoomId}' created by ${playerName}`);
        console.log('Room settings:', { roomType, maxPlayers, maxRounds, roundTime });
        broadcastRoomListUpdate();
        callback({ success: true, roomId: finalRoomId });
        console.log('=== [SERVER] CREATE-ROOM COMPLETE ===\n');
    });

    // --- SỰ KIỆN DÀNH CHO GAMEPLAY BÊN TRONG PHÒNG ---

    socket.on('join-game', (data) => {
        console.log('\n=== [SERVER] JOIN-GAME EVENT ===');
        console.log('Socket ID:', socket.id);
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        const { playerName, playerAvatar, roomId, password } = data;

        if (!playerName || !roomId) {
            console.log('❌ Join failed: Invalid player data');
            console.log('playerName:', playerName, '| roomId:', roomId);
            return socket.emit('join-error', { message: 'Invalid player data.' });
        }

        const room = rooms.get(roomId);
        console.log('Room exists?', !!room);
        console.log('Available rooms:', Array.from(rooms.keys()));

        if (!room) {
            console.log(`❌ Join failed: Room '${roomId}' does not exist`);
            return socket.emit('join-error', { message: `Room '${roomId}' does not exist.` });
        }

        if (!room.isValidPassword(password)) {
            console.log('❌ Join failed: Incorrect password');
            return socket.emit('join-error', { message: `Incorrect password for room '${roomId}'!` });
        }
        
        if (!room.canJoin()) {
            console.log('❌ Join failed: Room is full');
            return socket.emit('join-error', { message: `Room '${roomId}' is full.` });
        }
        
        console.log('✅ Player validation passed');
        const player = { id: socket.id, name: playerName, avatar: playerAvatar, roomId, events: [] };
        const isNewPlayer = !players.has(socket.id);
        
        if (isNewPlayer) {
            players.set(socket.id, player);
            room.players.push(player);
            room.scores.set(socket.id, 0);
            
            // If this is the first player joining, set initial player count
            if (room.players.length === 1) {
                room.initialPlayerCount = 1;
            }
            
            // If game has already started, adjust max rounds based on current player count
            if (room.isGameStarted) {
                const recommendedRounds = getRecommendedRounds(room.players.length);
                if (recommendedRounds > room.initialMaxRounds) {
                    room.maxRounds = recommendedRounds;
                    console.log(`[DYNAMIC ROUNDS] Increased maxRounds to ${room.maxRounds} for ${room.players.length} players`);
                }
            }
        }
        
        socket.join(roomId);
        console.log(`✅ Player '${playerName}' joined room '${roomId}'`);
        console.log('Room now has', room.players.length, 'players');

        // Send current game state to the joining player
        socket.emit('game-state', {
            ...room.getState(),
            isNewPlayer: isNewPlayer,
            currentWord: room.currentWord ? room.currentWord : null,
            timeLeft: room.timeLeft,
            isDrawer: room.currentDrawerId === socket.id
        });
        
        // Notify other players about the new player
        if (isNewPlayer) {
            socket.to(roomId).emit('player-joined', {
                player: { id: player.id, name: player.name, avatar: player.avatar, score: 0 },
                players: room.getState().players
            });
        }
        
        broadcastRoomListUpdate();

        // Start new round if not already started and we have enough players
        if (!room.isGameStarted && room.players.length >= 2) {
            console.log('🎮 Starting new game (2+ players)');
            room.isGameStarted = true;
            room.initialPlayerCount = room.players.length;
            startNewRound(room);
        }
        console.log('=== [SERVER] JOIN-GAME COMPLETE ===\n');
    });

    socket.on('select-word', (data) => {
        console.log('\n=== [SERVER] SELECT-WORD EVENT ===');
        console.log('Socket ID:', socket.id);
        console.log('Selected word:', data.word);
        
        const player = players.get(socket.id);
        if (!player) {
            console.log('❌ Player not found');
            return;
        }
        const room = rooms.get(player.roomId);
        if (!room) {
            console.log('❌ Room not found');
            return;
        }
        if (room.currentDrawerId !== socket.id) {
            console.log('❌ Not the current drawer');
            return;
        }
        if (room.currentWord) {
            console.log('❌ Word already selected');
            return;
        }

        room.currentWord = data.word;
        console.log('✅ Word set:', data.word);
        socket.emit('word-selected', { word: data.word });

        const hint = data.word.replace(/\S/g, '_');
        socket.to(player.roomId).emit('word-hint', { hint, length: data.word.length });
        console.log('Sent hint to guessers:', hint);

        console.log('⏱️ Starting timer...');
        room.startTimer(() => handleRoundEnd(room));
        console.log('=== [SERVER] SELECT-WORD COMPLETE ===\n');
    });

    socket.on('draw', (data) => {
        const player = players.get(socket.id);
        if (!player) {
            console.log('❌ [DRAW] Player not found:', socket.id);
            return;
        }
        // Log mỗi 10 draw để tránh spam
        if (!socket.drawCount) socket.drawCount = 0;
        socket.drawCount++;
        if (socket.drawCount % 10 === 0) {
            console.log(`[DRAW] Player ${player.name} drawing in room ${player.roomId} (count: ${socket.drawCount})`);
            console.log(`[DRAW] Broadcasting to room, sockets in room:`, gameNamespace.adapter.rooms.get(player.roomId)?.size || 0);
        }
        socket.to(player.roomId).emit('draw', data);
    });

    socket.on('clear-canvas', () => {
        const player = players.get(socket.id);
        if (!player) return;
        socket.to(player.roomId).emit('clear-canvas');
    });

    socket.on('chat-message', (data) => {
        const player = players.get(socket.id);
        if (!player) return;
        const room = rooms.get(player.roomId);
        if (!room || !room.currentWord) return;

        const message = (data.message || '').trim();
        if (message.length === 0 || message.length > 100) return;
        if (socket.id === room.currentDrawerId) return;

        const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (message.toLowerCase() === room.currentWord.toLowerCase()) {
            const points = Math.max(10, Math.floor(room.timeLeft / 5));
            const currentScore = room.scores.get(socket.id) || 0;
            room.scores.set(socket.id, currentScore + points);

            gameNamespace.to(player.roomId).emit('correct-answer', {
                playerId: socket.id, playerName: player.name, points, score: room.scores.get(socket.id)
            });
        } else {
            gameNamespace.to(player.roomId).emit('chat-message', {
                playerId: socket.id, playerName: player.name, playerAvatar: player.avatar, message: sanitizedMessage
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`\n=== [SERVER] DISCONNECT ===`);
        console.log('Socket ID:', socket.id);
        const player = players.get(socket.id);
        if (!player) {
            console.log('Player not found in players map');
            console.log('===========================\n');
            return;
        }

        console.log('Player disconnected:', player.name, 'from room:', player.roomId);
        players.delete(socket.id);
        const room = rooms.get(player.roomId);

        if (room) {
            room.removePlayer(socket.id);
            broadcastRoomListUpdate();

            if (room.players.length === 0) {
                room.stopTimer();
                rooms.delete(player.roomId);
                broadcastRoomListUpdate();
                console.log(`[DELETE] Room ${player.roomId} is empty and has been deleted.`);
            } else {
                gameNamespace.to(player.roomId).emit('player-left', {
                    playerId: socket.id, playerName: player.name, players: room.getState().players
                });
            }
        }
        console.log(`[Game] Player disconnected: ${socket.id}`);
    });
    
    // --- CÁC HÀM LOGIC GAME ---
    
    function startNewRound(room) {
        console.log('\n=== [SERVER] START NEW ROUND ===');
        console.log('Room:', room.roomId);
        console.log('Round:', room.round);
        console.log('Current drawer ID:', room.currentDrawerId);
        
        // Set drawer if not set (for new games)
        if (!room.currentDrawerId && room.players.length > 0) {
            room.currentDrawerId = room.players[0].id;
        }
        
        // Update max rounds based on current player count
        const recommended = getRecommendedRounds(room.players.length);
        if (recommended > room.initialMaxRounds) {
            room.initialMaxRounds = recommended;
            room.maxRounds = recommended;
            console.log(`[DYNAMIC ROUNDS] Updated maxRounds to ${room.maxRounds} (players: ${room.players.length})`);
        }

        room.currentWord = null;
        room.isGameStarted = true; // Lock room khi game bắt đầu
        console.log('✅ Reset currentWord to null, game started');
        
        const drawerId = room.currentDrawerId;
        const drawerSocket = gameNamespace.sockets.get(drawerId);
        const drawerPlayer = players.get(drawerId);
        
        console.log('Drawer player info:', drawerPlayer ? drawerPlayer.name : 'NOT FOUND');
        console.log('Drawer socket connected?', !!drawerSocket);
        console.log('Total sockets in namespace:', gameNamespace.sockets.size);
        
        if (drawerSocket) {
            const words = getRandomWords(3);
            console.log('📝 Sending word choices to drawer:', words);
            drawerSocket.emit('choose-word', { words });
            console.log('✅ choose-word event emitted to socket:', drawerId);
            // Auto-pick a word after 10s if drawer doesn't choose
            room.clearWordSelectTimer();
            room.wordSelectTimer = setTimeout(() => {
                if (!room.currentWord) {
                    const autoWord = words[Math.floor(Math.random() * words.length)];
                    console.log(`[AUTO-PICK] Drawer did not choose in time. Auto-selecting: ${autoWord}`);
                    room.currentWord = autoWord;
                    const hint = autoWord.replace(/\S/g, '_');
                    gameNamespace.to(room.roomId).emit('word-hint', { hint, length: autoWord.length });
                    room.startTimer(() => handleRoundEnd(room));
                }
            }, 10000);
        } else {
            console.log('❌ Drawer socket not found! ID:', drawerId);
            console.log('Available socket IDs:', Array.from(gameNamespace.sockets.keys()));
        }
        
        console.log('📢 Broadcasting next-round event...');
        room.broadcast('next-round', {
            round: room.round,
            currentDrawer: drawerId,
            maxRounds: room.maxRounds
        });
        console.log('=== [SERVER] START NEW ROUND COMPLETE ===\n');
    }
    
    function handleRoundEnd(room) {
        console.log('\n=== [SERVER] ROUND END ===');
        console.log('Room:', room.roomId);
        console.log('Word was:', room.currentWord);
        console.log('Current round:', room.round);
        
        // Stop timer để tránh timer cũ chạy song song
        console.log('🛑 Stopping current timer...');
        room.stopTimer();
        
        room.broadcast('round-end', {
            word: room.currentWord,
            scores: Array.from(room.scores.entries()).map(([id, score]) => ({ id, score }))
        });

        room.round++;
        console.log('Next round will be:', room.round);
        
        if (room.round > room.maxRounds) {
            console.log('🎉 Game over! Max rounds reached.');
            // Compute winner
            const standings = room.getState().players.sort((a,b)=> (b.score||0)-(a.score||0));
            const winner = standings[0] || null;
            room.broadcast('game-over', { standings, winner });
            // Reset after short delay and optionally auto-restart
            console.log('🔄 Resetting room in 5s...');
            setTimeout(() => {
                room.resetGame();
                if (room.players.length >= 2) {
                    console.log('🚀 Auto-restart game after reset');
                    startNewRound(room);
                } else {
                    console.log('⌛ Waiting for more players to start');
                }
                broadcastRoomListUpdate();
            }, 5000);
        } else {
            console.log('🔄 Moving to next drawer...');
            room.nextDrawer();
            console.log('Next drawer ID:', room.currentDrawerId);
            console.log('⏳ Waiting 5s before starting next round...');
            setTimeout(() => startNewRound(room), 5000); // Đợi 5s cho vòng mới
        }
        console.log('=== [SERVER] ROUND END COMPLETE ===\n');
    }
  });
};