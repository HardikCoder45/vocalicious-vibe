# Vocalicious Vibe - WebRTC Voice Chat

A real-time voice chat platform using WebRTC for direct peer-to-peer audio streaming.

## Features

- Real-time voice communication using pure WebRTC (no third-party services)
- Room-based voice conversations
- Visual indicators for speaking users
- Voice activity detection
- User profiles and authentication
- Single server architecture (Frontend + Backend on port 8080)

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Socket.io client for signaling
  - WebRTC for peer audio connections
  - Tailwind CSS for styling

- **Backend**:
  - Express server
  - Socket.io for WebRTC signaling
  - In-memory room management

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

## How It Works

1. **WebRTC Signaling**:
   - When a user joins a room, they establish WebRTC connections with all other users
   - Socket.io handles the signaling process (exchanging SDP offers/answers and ICE candidates)
   - Audio streams are sent directly between peers without going through the server

2. **Voice Activity Detection**:
   - The AudioContext API analyzes audio to detect when a user is speaking
   - Speaking status is shared via signaling to update UI for all users

3. **Room Management**:
   - Express API endpoints for getting room information
   - Socket.io events for real-time room updates

## API Endpoints

- `GET /api/rooms` - List all active rooms
- `GET /api/rooms/:roomId` - Get details for a specific room

## Socket.io Events

- `join-room`: Join a voice chat room
- `leave-room`: Leave a voice chat room
- `signal`: WebRTC signaling (offers, answers, candidates)
- `speaking`: Voice activity detection
- `user-connected`: New user joined
- `user-disconnected`: User left

## Configuration

You can adjust the ICE servers in `src/services/audioStreamService.ts` if needed. The default configuration uses Google's STUN servers.

## Troubleshooting

1. **Microphone Access Issues**:
   - Make sure your browser has permission to access your microphone
   - Check browser settings if you accidentally denied permission

2. **Connection Issues**:
   - Make sure you're on a network that allows WebRTC (some corporate firewalls block it)
   - Try using a different network if having connectivity problems
   - Use a modern browser that fully supports WebRTC (Chrome, Firefox, Safari, Edge)

3. **Audio Quality Issues**:
   - Use headphones to prevent echo
   - Make sure you have a stable internet connection
   - Close other applications using your microphone

## License

MIT
