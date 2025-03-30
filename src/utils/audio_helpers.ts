// audio_helpers.ts - Direct audio service utilities to avoid circular dependencies
import * as audioStreamService from '@/services/audioStreamService';

/**
 * Direct room joining without requiring AudioContext
 */
export const joinAudioRoomDirect = async (
  roomId: string, 
  userId: string, 
  username: string
): Promise<boolean> => {
  if (!roomId || !userId) {
    console.error("Missing required parameters for joinAudioRoomDirect");
    return false;
  }
  
  try {
    console.log(`Direct audio join for room: ${roomId} as ${username}`);
    
    // Initialize audio context if needed
    try {
      audioStreamService.initAudioContext();
    } catch (err) {
      console.warn("Audio context already initialized or error", err);
    }
    
    // Request audio stream first
    const stream = await audioStreamService.requestAudioStream();
    if (!stream) {
      console.error("Failed to get audio stream");
      return false;
    }
    
    // Now join the room
    const success = await audioStreamService.joinRoom(roomId, userId, username);
    
    if (success) {
      console.log("Successfully joined audio room directly");
      // Save room ID for reconnection
      localStorage.setItem('audio-room', roomId);
    } else {
      console.error("Failed to join audio room directly");
    }
    
    return success;
  } catch (error) {
    console.error("Error in direct audio room join:", error);
    return false;
  }
};

/**
 * Direct room leaving without requiring AudioContext
 */
export const leaveAudioRoomDirect = async (): Promise<boolean> => {
  try {
    console.log("Direct audio leave");
    
    // First stop all audio tracks
    try {
      audioStreamService.stopAllTracks();
    } catch (err) {
      console.warn("Error stopping tracks", err);
    }
    
    // Then leave the room
    const success = await audioStreamService.leaveRoom();
    
    if (success) {
      console.log("Successfully left audio room directly");
      // Remove saved room ID
      localStorage.removeItem('audio-room');
    } else {
      console.error("Failed to leave audio room directly");
    }
    
    return success;
  } catch (error) {
    console.error("Error in direct audio room leave:", error);
    
    // Force cleanup as a last resort
    try {
      audioStreamService.cleanup();
    } catch (e) {
      console.error("Error during forced cleanup:", e);
    }
    
    localStorage.removeItem('audio-room');
    return false;
  }
};

/**
 * Check if WebSocket is connected
 */
export const isSocketConnected = (): boolean => {
  const socket = audioStreamService.getSocket();
  return !!socket?.connected;
};

/**
 * Get audio connection status
 */
export const getAudioConnectionStatus = (): 'connected' | 'connecting' | 'disconnected' => {
  const state = audioStreamService.getStreamState();
  if (state.isConnected) return 'connected';
  if (state.isConnecting) return 'connecting';
  return 'disconnected';
};

/**
 * Initialize audio context
 */
export const initializeAudioSystem = (): boolean => {
  try {
    return audioStreamService.initAudioContext();
  } catch (e) {
    console.error("Error initializing audio system:", e);
    return false;
  }
}; 