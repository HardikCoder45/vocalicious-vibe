import { toast } from "sonner";
import io, { Socket } from "socket.io-client";

// Type definitions
type PeerConnection = {
  userId: string;
  username: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  audioTrack: MediaStreamTrack | null;
  isSpeaking: boolean;
  isBlocked?: boolean;
};

type StreamState = {
  localStream: MediaStream | null;
  localAudioTrack: MediaStreamTrack | null;
  peers: Map<string, PeerConnection>;
  socket: Socket | null;
  roomId: string | null;
  currentUserId: string | null;
  currentUsername: string | null;
  isMuted: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  audioContext: AudioContext | null;
  audioAnalyser: AnalyserNode | null;
  audioData: Uint8Array | null;
  speakingThreshold: number;
  speakingCallback?: (isSpeaking: boolean) => void;
  activeSpeakersCallback?: (speakers: string[]) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  speakingDetectionInterval: number | null;
  speakRequestsCallback?: (requests: { userId: string; username: string }[]) => void;
  userJoinedCallback?: (user: { userId: string; username: string }) => void;
  userLeftCallback?: (user: { userId: string; username: string }) => void;
  pendingSpeakRequests: Map<string, { userId: string; username: string }>;
};

// Configuration constants
const SERVER_URL = window.location.hostname === 'localhost' ? 
  `http://localhost:8080` : window.location.origin; // Use origin in production
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// State
const state: StreamState = {
  localStream: null,
  localAudioTrack: null,
  peers: new Map(),
  socket: null,
  roomId: null,
  currentUserId: null,
  currentUsername: null,
  isMuted: false,
  isConnecting: false,
  isConnected: false,
  audioContext: null,
  audioAnalyser: null,
  audioData: null,
  speakingThreshold: 15,
  connectionStatus: 'disconnected',
  speakingDetectionInterval: null,
  pendingSpeakRequests: new Map()
};

// Initialize audio context (needs to be called on user gesture)
export const initAudioContext = (): AudioContext => {
  if (!state.audioContext) {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      state.audioContext = new AudioContext();
      console.log("Audio context initialized");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      toast.error("Failed to initialize audio");
    }
  }
  return state.audioContext!;
};

// Initialize socket connection
const initSocket = (): Socket => {
  if (state.socket && state.socket.connected) return state.socket;
  
  // Close existing socket if it exists but is disconnected
  if (state.socket) {
    state.socket.close();
  }
  
  // Connect to the server
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  
  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // If we were in a room before, rejoin it
    if (state.roomId && state.currentUserId && state.currentUsername) {
      console.log(`Reconnecting to room ${state.roomId}`);
      
      socket.emit('join-room', {
        roomId: state.roomId,
        userId: state.currentUserId,
        username: state.currentUsername
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    state.connectionStatus = 'connecting';
    
    // Don't clear peer connections yet, as we might reconnect
    // Wait for reconnect timeout before cleaning up
    setTimeout(() => {
      if (!socket.connected) {
        console.log('Reconnection timed out, cleaning up connections');
        cleanupPeerConnections();
        state.connectionStatus = 'disconnected';
      }
    }, 5000);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    toast.error('Voice connection error - retrying...');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    toast.error('Voice connection error');
  });
  
  socket.on('room-joined', (data) => {
    console.log('Room joined:', data);
    handleRoomJoined(data);
  });
  
  socket.on('user-connected', (data) => {
    console.log('User connected:', data);
    handleNewUser(data);
  });
  
  socket.on('user-disconnected', (data) => {
    console.log('User disconnected:', data);
    handleUserDisconnect(data);
  });
  
  socket.on('signal', (data) => {
    handleSignal(data);
  });
  
  socket.on('user-speaking', (data) => {
    handleUserSpeaking(data);
  });
  
  socket.on('speak-request', (data) => {
    handleSpeakRequest(data);
  });
  
  socket.on('speak-approval', (data) => {
    handleSpeakApproval(data);
  });

  socket.on('speak-rejection', (data) => {
    handleSpeakRejection(data);
  });
  
  socket.on('speaker-blocked', (data) => {
    handleSpeakerBlocked(data);
  });
  
  socket.on('user-joined', (data) => {
    handleUserJoined(data);
  });
  
  state.socket = socket;
  return socket;
};

// Request access to the microphone
export const requestAudioStream = async (): Promise<MediaStream | null> => {
  try {
    if (state.localStream) {
      return state.localStream;
    }
    
    state.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        latency: 0.01,
        sampleRate: 48000,
        channelCount: 1,
      },
      video: false,
    });
    
    if (state.audioContext) {
      const source = state.audioContext.createMediaStreamSource(state.localStream);
      
      const compressor = state.audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      const filter = state.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 7000;
      
      source.connect(compressor);
      compressor.connect(filter);
      
      const dest = state.audioContext.createMediaStreamDestination();
      filter.connect(dest);
      
      const processedStream = dest.stream;
      const processedTrack = processedStream.getAudioTracks()[0];
      
      const originalTrack = state.localStream.getAudioTracks()[0];
      state.localStream.removeTrack(originalTrack);
      state.localStream.addTrack(processedTrack);
      state.localAudioTrack = processedTrack;
    } else {
      state.localAudioTrack = state.localStream.getAudioTracks()[0];
    }
    
    console.log("Microphone access granted with enhanced audio processing");
    setupAudioAnalysis(state.localStream);
    
    return state.localStream;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    toast.error("Could not access your microphone. Please check permissions.");
    return null;
  }
};

// Setup audio analysis for voice activity detection
const setupAudioAnalysis = (stream: MediaStream) => {
  if (!state.audioContext) {
    initAudioContext();
  }

  try {
    // Create analyzer
    state.audioAnalyser = state.audioContext!.createAnalyser();
    state.audioAnalyser.fftSize = 256;
    state.audioData = new Uint8Array(state.audioAnalyser.frequencyBinCount);

    // Connect stream to analyzer
    const source = state.audioContext!.createMediaStreamSource(stream);
    source.connect(state.audioAnalyser);

    // Setup speaking detection
    if (state.speakingDetectionInterval) {
      clearInterval(state.speakingDetectionInterval);
    }
    
    state.speakingDetectionInterval = window.setInterval(() => {
      detectSpeaking();
    }, 200) as unknown as number;
    
  } catch (error) {
    console.error("Error setting up audio analysis:", error);
  }
};

// Detect if user is speaking
const detectSpeaking = () => {
  if (!state.audioAnalyser || !state.audioData || state.isMuted) return;

  state.audioAnalyser.getByteFrequencyData(state.audioData);
  
  // Calculate average volume
  let sum = 0;
  for (let i = 0; i < state.audioData.length; i++) {
    sum += state.audioData[i];
  }
  const average = sum / state.audioData.length;
  
  // Determine if speaking based on threshold
  const isSpeaking = average > state.speakingThreshold;
  
  // Notify about speaking status
  if (state.speakingCallback) {
    state.speakingCallback(isSpeaking);
  }
  
  // Do not broadcast if peer is blocked
  const peer = state.peers.get(state.currentUserId || '');
  if (peer?.isBlocked) return;
  
  // Broadcast speaking status to other peers
  if (state.socket && state.currentUserId && state.roomId) {
    state.socket.emit('speaking', {
      userId: state.currentUserId,
      isSpeaking
    });
  }
};

// Join a room with voice capabilities
export const joinRoom = async (
  roomId: string,
  userId: string,
  username: string,
  avatar?: string,
  isModerator: boolean = false,
  isSpeaker: boolean = false
): Promise<boolean> => {
  try {
    if (state.isConnecting) {
      return false;
    }
    
    state.isConnecting = true;
    state.connectionStatus = 'connecting';
    
    // Initialize socket if not already done
    const socket = initSocket();
    
    // Request audio permissions
    const stream = await requestAudioStream();
    if (!stream) {
      throw new Error("Failed to get audio stream");
    }
    
    // Store user info
    state.currentUserId = userId;
    state.currentUsername = username;
    state.roomId = roomId;
    
    // Clean up any existing connections
    cleanupPeerConnections();
    
    // Join the room with additional metadata
    socket.emit('join-room', {
      roomId,
      userId,
      username,
      avatar,
      isModerator,
      isSpeaker
    });
    
    console.log(`Joining room: ${roomId} as ${isModerator ? 'moderator' : isSpeaker ? 'speaker' : 'listener'}`);
    
    return true;
  } catch (error) {
    console.error("Error joining room:", error);
    state.isConnecting = false;
    state.connectionStatus = 'disconnected';
    toast.error("Failed to join voice chat");
    return false;
  }
};

// Leave the current room
export const leaveRoom = async (): Promise<boolean> => {
  if (!state.socket || !state.roomId || !state.currentUserId) {
    return false;
  }
  
  try {
    // Notify server
    state.socket.emit('leave-room', {
      roomId: state.roomId,
      userId: state.currentUserId
    });
    
    // Clean up connections
    cleanupPeerConnections();
    
    // Reset state
    state.roomId = null;
    state.isConnected = false;
    state.connectionStatus = 'disconnected';
    
    return true;
  } catch (error) {
    console.error("Error leaving room:", error);
    return false;
  }
};

// Handle room joined event
const handleRoomJoined = (data: { roomId: string; participants: Record<string, any> }) => {
  state.isConnecting = false;
  state.isConnected = true;
  state.connectionStatus = 'connected';
  
  console.log(`Successfully joined room ${data.roomId} with ${Object.keys(data.participants).length} participants`);
  
  // Create peer connections with existing participants
  Object.entries(data.participants).forEach(([userId, participant]) => {
    if (userId !== state.currentUserId) {
      handleNewUser({
        userId,
        username: participant.username,
        avatar: participant.avatar
      });
    }
  });
  
  toast.success("Voice chat connected");
};

// Handle new user joining the room
const handleNewUser = async (data: { userId: string; username: string; avatar?: string }) => {
  if (data.userId === state.currentUserId) return;
  
  console.log(`Initiating connection to new user: ${data.username} (${data.userId})`);
  
  try {
    // Create a new peer connection
    const peerConnection = await createPeerConnection(data.userId);
    
    // Store in peers map
    state.peers.set(data.userId, {
      userId: data.userId,
      username: data.username,
      connection: peerConnection,
      stream: null,
      audioTrack: null,
      isSpeaking: false,
    });
    
    // Create and send offer
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    
    await peerConnection.setLocalDescription(offer);
    
    // Send the offer to the remote peer
    state.socket?.emit('signal', {
      userId: state.currentUserId,
      targetId: data.userId,
      signal: {
        type: 'offer',
        sdp: peerConnection.localDescription
      }
    });
  } catch (error) {
    console.error(`Error connecting to user ${data.userId}:`, error);
  }
};

// Handle user disconnecting from the room
const handleUserDisconnect = (data: { userId: string }) => {
  const peer = state.peers.get(data.userId);
  
  if (peer) {
    // Close the connection
    peer.connection.close();
    
    // Remove from peers map
    state.peers.delete(data.userId);
    
    // Update active speakers
    updateActiveSpeakers();
  }
};

// Handle WebRTC signaling
const handleSignal = async (data: { userId: string; signal: any }) => {
  const { userId, signal } = data;
  
  // Ignore our own signals
  if (userId === state.currentUserId) return;
  
  console.log(`Received signal from ${userId}:`, signal.type);
  
  try {
    let peer = state.peers.get(userId);
    
    // If we receive an offer but don't have this peer yet, create a connection
    if (!peer || (signal.type === 'offer' && peer.connection.connectionState === 'closed')) {
      console.log(`Creating new peer connection for ${userId} in response to ${signal.type}`);
      const peerConnection = await createPeerConnection(userId);
      
      peer = {
        userId,
        username: 'Peer', // Will be updated later
        connection: peerConnection,
        stream: null,
        audioTrack: null,
        isSpeaking: false,
      };
      
      state.peers.set(userId, peer);
    }
    
    if (!peer) {
      console.error(`Received signal from unknown peer: ${userId}`);
      return;
    }
    
    // Process the signal based on type
    if (signal.type === 'offer') {
      console.log(`Processing offer from ${userId}`);
      
      try {
        // Check if we have a remote description already
        const currentState = peer.connection.signalingState;
        
        if (currentState !== 'stable') {
          console.log(`Connection not stable (${currentState}), resetting before applying offer`);
          // Apply rollback to get back to stable state
          await peer.connection.setLocalDescription({type: 'rollback'});
        }
        
        await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        
        // Send answer back
        state.socket?.emit('signal', {
          userId: state.currentUserId,
          targetId: userId,
          signal: {
            type: 'answer',
            sdp: peer.connection.localDescription
          }
        });
        console.log(`Sent answer to ${userId}`);
      } catch (err) {
        console.error(`Error processing offer from ${userId}:`, err);
        // Try to recover by recreating the connection
        state.peers.delete(userId);
        handleNewUser({ userId, username: 'Reconnecting User' });
      }
    } else if (signal.type === 'answer') {
      console.log(`Processing answer from ${userId}`);
      try {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        console.log(`Set remote description for ${userId}`);
      } catch (err) {
        console.error(`Error processing answer from ${userId}:`, err);
      }
    } else if (signal.type === 'candidate' && signal.candidate) {
      console.log(`Processing ICE candidate from ${userId}`);
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        console.log(`Added ICE candidate for ${userId}`);
      } catch (err) {
        console.error(`Error processing ICE candidate from ${userId}:`, err);
      }
    }
  } catch (error) {
    console.error(`Error processing signal from user ${userId}:`, error);
  }
};

// Handle speaker status updates
const handleUserSpeaking = (data: { userId: string; isSpeaking: boolean }) => {
  const peer = state.peers.get(data.userId);
  
  if (peer) {
    peer.isSpeaking = data.isSpeaking;
    state.peers.set(data.userId, peer);
    
    // Update active speakers list
    updateActiveSpeakers();
  }
};

// Create a new peer connection
const createPeerConnection = async (remoteUserId: string): Promise<RTCPeerConnection> => {
  // Make sure we have local stream
  if (!state.localStream) {
    await requestAudioStream();
  }
  
  // Create peer connection with advanced configuration
  const peerConnection = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceTransportPolicy: 'all',
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  } as RTCConfiguration);
  
  // Add our audio track
  if (state.localStream) {
    state.localStream.getAudioTracks().forEach(track => {
      if (!state.localStream) return;
      
      console.log(`Adding local audio track to connection with ${remoteUserId}`);
      peerConnection.addTrack(track, state.localStream);
      
      // Apply muted state if needed
      if (state.isMuted) {
        track.enabled = false;
      }
    });
  }
  
  // ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log(`Sending ICE candidate to ${remoteUserId}`);
      state.socket?.emit('signal', {
        userId: state.currentUserId,
        targetId: remoteUserId,
        signal: {
          type: 'candidate',
          candidate: event.candidate
        }
      });
    }
  };
  
  // ICE connection state change monitoring
  peerConnection.oniceconnectionstatechange = () => {
    console.log(`ICE connection state with ${remoteUserId}: ${peerConnection.iceConnectionState}`);
    
    // Handle disconnection and reconnection
    if (peerConnection.iceConnectionState === 'disconnected' || 
        peerConnection.iceConnectionState === 'failed') {
      console.log(`Connection with ${remoteUserId} failed or disconnected. Attempting to reconnect.`);
      
      // Give it some time to reconnect on its own
      setTimeout(() => {
        if (peerConnection.iceConnectionState === 'failed' || 
            peerConnection.iceConnectionState === 'disconnected') {
          console.log(`Recreating connection with ${remoteUserId}`);
          
          // Remove the peer and create a new connection
          if (state.socket && state.socket.connected && state.peers.has(remoteUserId)) {
            state.peers.delete(remoteUserId);
            handleNewUser({ userId: remoteUserId, username: 'Reconnecting User' });
          }
        }
      }, 5000);
    }
  };
  
  // Connection state monitoring
  peerConnection.onconnectionstatechange = () => {
    console.log(`Connection state with ${remoteUserId}: ${peerConnection.connectionState}`);
    
    if (peerConnection.connectionState === 'connected') {
      console.log(`Stable connection established with ${remoteUserId}`);
    }
  };
  
  // When we receive tracks
  peerConnection.ontrack = (event) => {
    console.log(`Received track from ${remoteUserId}:`, event.track.kind);
    
    const peer = state.peers.get(remoteUserId);
    
    if (peer && event.streams && event.streams[0]) {
      peer.stream = event.streams[0];
      peer.audioTrack = event.streams[0].getAudioTracks()[0];
      state.peers.set(remoteUserId, peer);
      
      // Create audio element to play the remote stream
      const audioElement = new Audio();
      audioElement.srcObject = event.streams[0];
      audioElement.autoplay = true;
      audioElement.volume = 1.0;  // Ensure full volume
      
      // Error handling for audio playback
      audioElement.onerror = (error) => {
        console.error(`Error playing audio from ${remoteUserId}:`, error);
      };
      
      // Log when audio actually starts playing
      audioElement.onplaying = () => {
        console.log(`Audio from ${remoteUserId} is now playing!`);
      };
      
      console.log(`Audio track received from ${remoteUserId}, created audio element`, audioElement);
    }
  };
  
  return peerConnection;
};

// Clean up all peer connections
const cleanupPeerConnections = () => {
  state.peers.forEach((peer) => {
    peer.connection.close();
  });
  
  state.peers.clear();
  updateActiveSpeakers();
};

// Update the list of active speakers
const updateActiveSpeakers = () => {
  const activeSpeakers = Array.from(state.peers.values())
    .filter(peer => peer.isSpeaking)
    .map(peer => peer.userId);
  
  // Notify callback
  if (state.activeSpeakersCallback) {
    state.activeSpeakersCallback(activeSpeakers);
  }
};

// Set the callback for speaking status changes
export const setSpeakingCallback = (callback: (isSpeaking: boolean) => void) => {
  state.speakingCallback = callback;
};

// Set the callback for active speakers list changes
export const setActiveSpeakersCallback = (callback: (speakers: string[]) => void) => {
  state.activeSpeakersCallback = callback;
};

// Toggle mute status for local audio
export const toggleMute = (forceMute?: boolean): boolean => {
  // If force mute is provided, use that value, otherwise toggle current state
  const newMuteState = forceMute !== undefined ? forceMute : !state.isMuted;
  
  if (state.localAudioTrack) {
    state.localAudioTrack.enabled = !newMuteState;
  }
  
  state.isMuted = newMuteState;
  
  return state.isMuted;
};

// Get the current state of the audio stream
export const getStreamState = () => {
  return {
    isConnected: state.isConnected,
    isMuted: state.isMuted,
    connectionStatus: state.connectionStatus,
    roomId: state.roomId,
    peerCount: state.peers.size,
    speakingThreshold: state.speakingThreshold,
    hasLocalStream: !!state.localStream
  };
};

// Clean up resources on component unmount
export const cleanup = () => {
  // Stop speaking detection
  if (state.speakingDetectionInterval) {
    clearInterval(state.speakingDetectionInterval);
    state.speakingDetectionInterval = null;
  }
  
  // Leave the room if connected
  if (state.isConnected) {
    leaveRoom();
  }
  
  // Clean up peer connections
  cleanupPeerConnections();
  
  // Stop local stream tracks
  if (state.localStream) {
    state.localStream.getTracks().forEach(track => track.stop());
    state.localStream = null;
    state.localAudioTrack = null;
  }
  
  // Reset state
  state.socket = null;
  state.roomId = null;
  state.currentUserId = null;
  state.currentUsername = null;
  state.isConnected = false;
  state.isConnecting = false;
  state.connectionStatus = 'disconnected';
};

// Request to speak in a room as a listener
export const requestToSpeak = (
  roomId: string,
  userId: string,
  username: string
): boolean => {
  if (!state.socket || !state.isConnected) {
    console.error("Cannot request to speak: not connected to socket");
    return false;
  }
  
  state.socket.emit('request-to-speak', {
    roomId,
    userId,
    username
  });
  
  return true;
};

// Handle incoming speak request (for moderators)
const handleSpeakRequest = (data: { roomId: string; userId: string; username: string }) => {
  console.log(`Received speaker request from ${data.username} (${data.userId})`);
  
  // Store the request
  state.pendingSpeakRequests.set(data.userId, {
    userId: data.userId,
    username: data.username
  });
  
  // Notify via callback
  if (state.speakRequestsCallback) {
    const requests = Array.from(state.pendingSpeakRequests.values());
    state.speakRequestsCallback(requests);
  }
  
  // Show toast notification for moderators
  toast.info(`${data.username} wants to speak`, {
    description: "Check speaker requests to approve",
    action: {
      label: "View",
      onClick: () => {
        // This could open a modal with speaker requests
        console.log("View speaker requests");
      }
    }
  });
};

// Approve a user's request to speak (moderator action)
export const approveSpeaker = (userId: string): boolean => {
  if (!state.socket || !state.isConnected || !state.roomId) {
    console.error("Cannot approve speaker: not connected to socket");
    return false;
  }
  
  state.socket.emit('approve-speaker', {
    roomId: state.roomId,
    userId,
    approvedBy: state.currentUserId
  });
  
  // Remove from pending requests
  state.pendingSpeakRequests.delete(userId);
  
  // Update callback
  if (state.speakRequestsCallback) {
    const requests = Array.from(state.pendingSpeakRequests.values());
    state.speakRequestsCallback(requests);
  }
  
  return true;
};

// Handle speak approval notification
const handleSpeakApproval = (data: { userId: string, approvedBy?: string }) => {
  if (data.userId === state.currentUserId) {
    // If this is the current user, they've been approved to speak
    toast.success("Your request to speak has been approved!");
    
    // Try to update user_profiles table via fetch API
    try {
      fetch('/api/update-speaker-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.userId,
          isSpeaker: true
        }),
      }).catch(err => console.error('Error updating speaker status in database:', err));
    } catch (err) {
      console.error('Error calling update speaker API:', err);
    }
  }
};

// Handle speak rejection notification
const handleSpeakRejection = (data: { userId: string }) => {
  if (data.userId === state.currentUserId) {
    // If this is the current user, they've been rejected
    toast.info("Your request to speak was not approved at this time");
  }
  
  // Remove from pending requests if it's a moderator receiving this
  state.pendingSpeakRequests.delete(data.userId);
  
  // Update callback
  if (state.speakRequestsCallback) {
    const requests = Array.from(state.pendingSpeakRequests.values());
    state.speakRequestsCallback(requests);
  }
};

// Block a speaker (moderator action)
export const blockSpeaker = (userId: string): boolean => {
  if (!state.socket || !state.isConnected || !state.roomId) {
    console.error("Cannot block speaker: not connected to socket");
    return false;
  }
  
  state.socket.emit('block-speaker', {
    roomId: state.roomId,
    userId
  });
  
  // Mark peer as blocked locally
  const peer = state.peers.get(userId);
  if (peer) {
    peer.isBlocked = true;
    state.peers.set(userId, peer);
  }
  
  return true;
};

// Handle speaker blocked notification
const handleSpeakerBlocked = (data: { userId: string }) => {
  if (data.userId === state.currentUserId) {
    // If this is the current user, they've been blocked
    toast.warning("A moderator has muted your microphone");
    // Force mute
    toggleMute(true);
  }
  
  // Update peer status
  const peer = state.peers.get(data.userId);
  if (peer) {
    peer.isBlocked = true;
    peer.isSpeaking = false;
    state.peers.set(data.userId, peer);
    
    // Update active speakers
    updateActiveSpeakers();
  }
};

// Handle user joining the room
const handleUserJoined = (data: { userId: string; username: string }) => {
  console.log(`User joined: ${data.username} (${data.userId})`);
  
  // Notify via callback
  if (state.userJoinedCallback) {
    state.userJoinedCallback({
      userId: data.userId,
      username: data.username
    });
  }
  
  // Don't show toast for initial connections when joining a room
  if (state.isConnected && state.connectionStatus === 'connected') {
    toast.info(`${data.username} joined the room`);
  }
};

// Set the callback for speaker requests
export const setSpeakRequestsCallback = (callback: (requests: { userId: string; username: string }[]) => void) => {
  state.speakRequestsCallback = callback;
};

// Set the callback for user joined events
export const setUserJoinedCallback = (callback: (user: { userId: string; username: string }) => void) => {
  state.userJoinedCallback = callback;
};

// Set the callback for user left events
export const setUserLeftCallback = (callback: (user: { userId: string; username: string }) => void) => {
  state.userLeftCallback = callback;
};

// Reject a user's request to speak (moderator action)
export const rejectSpeaker = (userId: string): boolean => {
  if (!state.socket || !state.isConnected || !state.roomId) {
    console.error("Cannot reject speaker: not connected to socket");
    return false;
  }
  
  state.socket.emit('reject-speaker', {
    roomId: state.roomId,
    userId,
    rejectedBy: state.currentUserId
  });
  
  // Remove from pending requests
  state.pendingSpeakRequests.delete(userId);
  
  // Update callback
  if (state.speakRequestsCallback) {
    const requests = Array.from(state.pendingSpeakRequests.values());
    state.speakRequestsCallback(requests);
  }
  
  return true;
};