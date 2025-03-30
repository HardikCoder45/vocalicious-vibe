const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

// Environment configuration
const PORT = process.env.PORT || 8080;
const dev = process.env.NODE_ENV !== 'production';

// Create Express app
const app = express();

// Set up middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  connectTimeout: 30000,
  transports: ['websocket', 'polling'],
});

// Active rooms and participants tracking
const activeRooms = new Map();
global.activeRooms = activeRooms;
global.io = io;

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let currentRoom = null;
  let currentUser = null;
  
  // Join room event
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userId, username, avatar } = data;
      
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Room ID and User ID are required' });
        return;
      }
      
      console.log(`User ${userId} attempting to join room ${roomId}`);
      
      // Store previous room for logging
      const previousRoom = currentRoom;
      
      // Check if user is already in this room
      if (currentRoom === roomId && currentUser === userId) {
        console.log(`User ${userId} is already in room ${roomId}, just updating socket ID`);
        
        // Just update the socket ID in the user data
        if (activeRooms.has(roomId)) {
          const roomData = activeRooms.get(roomId);
          if (roomData.participants[userId]) {
            roomData.participants[userId].socketId = socket.id;
            activeRooms.set(roomId, roomData);
            
            // Send current participants to the user
            socket.emit('room-joined', {
              roomId,
              participants: roomData.participants
            });
            
            return;
          }
        }
      }
      
      // Leave current room if already in one and it's different from the requested room
      if (currentRoom && currentRoom !== roomId) {
        socket.leave(currentRoom);
        socket.to(currentRoom).emit('user-disconnected', { userId });
        
        // Remove user from room tracking
        if (activeRooms.has(currentRoom)) {
          const roomData = activeRooms.get(currentRoom);
          delete roomData.participants[userId];
          
          // Clean up empty rooms
          if (Object.keys(roomData.participants).length === 0) {
            activeRooms.delete(currentRoom);
            console.log(`Room ${currentRoom} has been deleted (empty)`);
          } else {
            activeRooms.set(currentRoom, roomData);
          }
        }
        
        console.log(`User ${userId} left room ${currentRoom} to join room ${roomId}`);
      }
      
      // Initialize room if doesn't exist
      if (!activeRooms.has(roomId)) {
        console.log(`Creating new room: ${roomId}`);
        activeRooms.set(roomId, {
          participants: {},
          created: Date.now()
        });
      }
      
      // Add user to room tracking
      const roomData = activeRooms.get(roomId);
      roomData.participants[userId] = {
        id: userId,
        username: username || 'Anonymous',
        avatar: avatar || '',
        socketId: socket.id,
        joinedAt: Date.now(),
        isSpeaking: false
      };
      activeRooms.set(roomId, roomData);
      
      // Join the socket room
      await socket.join(roomId);
      currentRoom = roomId;
      currentUser = userId;
      
      // Send current participants to the new user
      socket.emit('room-joined', {
        roomId,
        participants: roomData.participants
      });
      
      // Notify other participants about the new user only if this is a new room join
      if (previousRoom !== roomId) {
        socket.to(roomId).emit('user-connected', {
          userId,
          username: username || 'Anonymous',
          avatar: avatar || ''
        });
      }
      
      console.log(`User ${userId} successfully joined room ${roomId} with ${Object.keys(roomData.participants).length} participants`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // WebRTC signaling for peer connection
  socket.on('signal', (data) => {
    const { userId, targetId, signal } = data;
    
    if (!currentRoom) {
      socket.emit('error', { message: 'You must join a room first' });
      return;
    }
    
    if (!userId || !signal) {
      socket.emit('error', { message: 'Invalid signal data' });
      return;
    }
    
    console.log(`Signal from ${userId} to ${targetId || 'all'}`);
    
    // If targetId is provided, send only to that specific peer
    if (targetId) {
      // Find the socket ID for the target user
      const roomData = activeRooms.get(currentRoom);
      if (roomData && roomData.participants[targetId]) {
        const targetSocketId = roomData.participants[targetId].socketId;
        if (targetSocketId) {
          io.to(targetSocketId).emit('signal', {
            userId,
            signal
          });
          return;
        }
      }
    }
    
    // Otherwise broadcast to all peers in the room
    socket.to(currentRoom).emit('signal', {
      userId,
      signal
    });
  });
  
  // Voice activity detection
  socket.on('speaking', (data) => {
    const { userId, isSpeaking } = data;
    
    if (!currentRoom || !userId) {
      return;
    }
    
    // Update user's speaking status
    if (activeRooms.has(currentRoom)) {
      const roomData = activeRooms.get(currentRoom);
      if (roomData.participants[userId]) {
        roomData.participants[userId].isSpeaking = isSpeaking;
        activeRooms.set(currentRoom, roomData);
      }
    }
    
    // Broadcast speaking status to all room participants
    socket.to(currentRoom).emit('user-speaking', {
      userId,
      isSpeaking
    });
  });
  
  // Leave room event
  socket.on('leave-room', (data) => {
    const { userId, roomId } = data;
    
    if (!roomId) {
      return;
    }
    
    handleUserLeave(socket, userId || currentUser, roomId);
    currentRoom = null;
    currentUser = null;
  });
  
  // Disconnection handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up if user was in a room
    if (currentRoom && currentUser) {
      handleUserLeave(socket, currentUser, currentRoom);
    }
  });
});

// Helper function to handle user leaving
function handleUserLeave(socket, userId, roomId) {
  if (!userId || !roomId) {
    console.log('Missing userId or roomId in handleUserLeave');
    return;
  }
  
  console.log(`Handling leave for user ${userId} from room ${roomId}`);
  
  // Check if user is in the room first
  const roomExists = activeRooms.has(roomId);
  const userInRoom = roomExists && activeRooms.get(roomId).participants[userId];
  
  if (!roomExists) {
    console.log(`Room ${roomId} does not exist, skipping leave`);
    return;
  }
  
  if (!userInRoom) {
    console.log(`User ${userId} not found in room ${roomId}, skipping leave`);
    return;
  }
  
  socket.leave(roomId);
  
  // Check if the user has another connection in the same room (multiple tabs/devices)
  let hasOtherConnection = false;
  
  // Iterate through all socket connections
  const connectedSockets = Array.from(io.sockets.sockets).map(s => s[0]);
  
  for (const socketId of connectedSockets) {
    if (socketId !== socket.id) {
      const socketRooms = io.sockets.adapter.socketRooms(socketId);
      if (socketRooms && socketRooms.has(roomId)) {
        // Check if this socket is for the same user
        const roomData = activeRooms.get(roomId);
        const participantIds = Object.keys(roomData.participants);
        for (const pid of participantIds) {
          if (pid === userId && roomData.participants[pid].socketId !== socket.id) {
            hasOtherConnection = true;
            console.log(`User ${userId} has another connection in room ${roomId}, not removing from room`);
            break;
          }
        }
      }
    }
    
    if (hasOtherConnection) break;
  }
  
  // Only remove the user from the room if they don't have another connection
  if (!hasOtherConnection) {
    // Notify other users
    socket.to(roomId).emit('user-disconnected', { userId });
    
    // Remove user from room data
    const roomData = activeRooms.get(roomId);
    delete roomData.participants[userId];
    
    // Clean up empty rooms
    if (Object.keys(roomData.participants).length === 0) {
      activeRooms.delete(roomId);
      console.log(`Room ${roomId} has been deleted (empty)`);
    } else {
      activeRooms.set(roomId, roomData);
    }
    
    console.log(`User ${userId} left room ${roomId}`);
  }
}

// API Routes

// Get active rooms
app.get('/api/rooms', (req, res) => {
  const rooms = [];
  
  activeRooms.forEach((data, roomId) => {
    rooms.push({
      id: roomId,
      participants: Object.values(data.participants),
      participantCount: Object.keys(data.participants).length,
      created: data.created
    });
  });
  
  res.json({ rooms });
});

// Get room details
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!activeRooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const roomData = activeRooms.get(roomId);
  
  res.json({
    id: roomId,
    participants: Object.values(roomData.participants),
    participantCount: Object.keys(roomData.participants).length,
    created: roomData.created
  });
});

// API endpoint for handling browser close events
app.post('/api/leave-room', (req, res) => {
  try {
    const { userId, roomId } = req.body;
    
    if (!userId || !roomId) {
      return res.status(400).json({ error: 'Missing userId or roomId' });
    }
    
    console.log(`Received leave request via API for user ${userId} from room ${roomId}`);
    
    // Clean up room state
    if (activeRooms.has(roomId)) {
      const roomData = activeRooms.get(roomId);
      
      if (roomData.participants[userId]) {
        // Notify room participants
        io.to(roomId).emit('user-disconnected', { userId });
        
        // Remove user from room
        delete roomData.participants[userId];
        
        // Clean up empty rooms
        if (Object.keys(roomData.participants).length === 0) {
          activeRooms.delete(roomId);
          console.log(`Room ${roomId} has been deleted (empty)`);
        } else {
          activeRooms.set(roomId, roomData);
        }
        
        console.log(`User ${userId} removed from room ${roomId} via API`);
      }
    }
    
    // For beacon requests, we don't need to send a response
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      res.status(204).end();
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error processing leave-room API request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend based on environment
if (dev) {
  // In development mode, use Vite's development server
  console.log('Running in development mode with Vite middleware');
  
  // Dynamically import Vite
  (async () => {
    try {
      const { createServer: createViteServer } = await import('vite');
      
      // Create Vite server in middleware mode
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: process.cwd(),
      });
      
      // Use Vite's connect instance as middleware
      app.use(vite.middlewares);
      
      // Handle all other routes for SPA
      app.use('*', async (req, res, next) => {
        try {
          const url = req.originalUrl;
          
          // If it's an API request or socket connection, skip
          if (url.startsWith('/api') || url.startsWith('/socket.io')) {
            return next();
          }
          
          // Read index.html
          let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
          
          // Apply Vite HTML transforms
          template = await vite.transformIndexHtml(url, template);
          
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          console.error('Vite middleware error:', e);
          next(e);
        }
      });
      
      console.log('Vite middleware setup complete');
    } catch (e) {
      console.error('Error setting up Vite middleware:', e);
      console.error('Make sure you have vite installed: npm install --save-dev vite');
    }
  })();
} else {
  // In production mode, serve the built files
  console.log('Running in production mode');
  
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  // For any other routes, serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebRTC signaling server available at ws://localhost:${PORT}`);
}); 