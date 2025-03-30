import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import * as audioStreamService from '../services/audioStreamService';
import { useUser } from './UserContext';

interface AudioContextType {
  isListening: boolean;
  isMuted: boolean;
  activeSpeakers: string[];
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleMute: () => void;
  isUserSpeaking: boolean;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'disconnecting';
  currentRoomId: string | null;
  requestsToSpeak: {userId: string; username: string}[];
  approveSpeaker: (userId: string) => boolean;
  rejectSpeaker: (userId: string) => boolean;
  blockSpeaker: (userId: string) => boolean;
}

const AudioContext = createContext<AudioContextType>({
  isListening: false,
  isMuted: false,
  activeSpeakers: [],
  startListening: async () => {},
  stopListening: () => {},
  toggleMute: () => {},
  isUserSpeaking: false,
  joinRoom: async () => false,
  leaveRoom: async () => false,
  isConnected: false,
  connectionStatus: 'disconnected',
  currentRoomId: null,
  requestsToSpeak: [],
  approveSpeaker: () => false,
  rejectSpeaker: () => false,
  blockSpeaker: () => false
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser } = useUser();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'disconnecting'>('disconnected');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [requestsToSpeak, setRequestsToSpeak] = useState<{userId: string; username: string}[]>([]);
  const permissionRequested = useRef(false);
  const audioInitialized = useRef(false);
  
  // Initialize audio on mount
  useEffect(() => {
    if (!audioInitialized.current) {
      // Initialize audio context
      try {
        audioStreamService.initAudioContext();
        audioInitialized.current = true;
        
        // Set up callbacks
        audioStreamService.setSpeakingCallback((speaking) => {
          setIsUserSpeaking(speaking);
        });
        
        audioStreamService.setActiveSpeakersCallback((speakers) => {
          setActiveSpeakers(speakers);
        });
        
        // Set up speaker request callbacks
        audioStreamService.setSpeakRequestsCallback((requests) => {
          setRequestsToSpeak(requests);
        });
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    }
    
    // Cleanup on unmount
    return () => {
      leaveRoom();
      audioStreamService.cleanup();
    };
  }, []);
  
  // Request microphone permission on first interaction
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (permissionRequested.current) {
      return true;
    }
    
    try {
      const stream = await audioStreamService.requestAudioStream();
      permissionRequested.current = true;
      
      if (stream) {
        return true;
      } else {
        toast.error('Microphone permission denied. Please enable it in your browser settings.');
        return false;
      }
    } catch (error) {
      console.error("Error requesting microphone:", error);
      toast.error('Could not access microphone. Voice features will be limited.');
      return false;
    }
  };
  
  // Start listening for audio input
  const startListening = async (): Promise<void> => {
    if (!currentUser) {
      toast.error('You need to be logged in to use audio features');
      return;
    }
    
    if (isListening) {
      return; // Already listening
    }
    
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      return;
    }
    
    setIsListening(true);
    
    // If previously muted, stay muted
    if (isMuted) {
      audioStreamService.toggleMute(true);
    } else {
      audioStreamService.toggleMute(false);
    }
    
    console.log("Audio listening started");
  };
  
  // Stop listening for audio input
  const stopListening = () => {
    if (!isListening) return;
    
    setIsListening(false);
    audioStreamService.toggleMute(true); // Mute when stopping
    console.log("Audio listening stopped");
  };
  
  // Toggle mute status
  const toggleMute = () => {
    if (!isListening) {
      startListening().then(() => {
        setIsMuted(true);
        audioStreamService.toggleMute(true);
      });
      return;
    }
    
    const newMuteState = audioStreamService.toggleMute();
    setIsMuted(newMuteState);
  };
  
  // Join a voice chat room
  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error('You need to be logged in to join a room');
      return false;
    }
    
    // Check if already in this room - just return true
    if (roomId === currentRoomId && isConnected) {
      console.log('Already connected to this room');
      return true;
    }
    
    // Check if there's a connection in progress or failed recently
    if (connectionStatus === 'connecting') {
      console.log('Connection already in progress, wait for it to complete');
      toast.info('Voice connection in progress...');
      return false;
    }
    
    try {
      // First ensure the microphone is active
      await startListening();
      
      setConnectionStatus('connecting');
      console.log(`Attempting to join voice chat in room: ${roomId}`);
      
      // Get username from user profile
      const username = typeof currentUser === 'object' && currentUser !== null ? 
        (currentUser.user_metadata?.username || 
         currentUser.email || 
         (currentUser as any).name || 
         'Anonymous User') : 'Anonymous User';
      
      let avatar = null;
      if (typeof currentUser === 'object' && currentUser !== null) {
        avatar = currentUser.user_metadata?.avatar_url || null;
      }
      
      // Join the room with WebRTC
      const success = await audioStreamService.joinRoom(
        roomId,
        currentUser.id,
        username,
        avatar
      );
      
      if (success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setCurrentRoomId(roomId);
        
        // Store room in local storage for reconnection
        localStorage.setItem('voice-room-id', roomId);
        
        console.log(`Successfully joined voice chat in room: ${roomId}`);
        toast.success('Connected to voice chat');
        return true;
      } else {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.error(`Failed to join voice chat in room: ${roomId}`);
        toast.error('Failed to join voice chat room');
        
        // Retry after a short delay
        setTimeout(() => {
          if (roomId === currentRoomId && !isConnected) {
            console.log('Retrying voice connection...');
            joinRoom(roomId).catch(console.error);
          }
        }, 5000);
        
        return false;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      toast.error('Failed to connect to voice chat');
      return false;
    }
  };
  
  // Leave the current room
  const leaveRoom = async (): Promise<boolean> => {
    if (!isConnected && connectionStatus !== 'connected') {
      console.log('Not currently connected to a voice chat');
      return true; // Already disconnected
    }
    
    try {
      setConnectionStatus('disconnecting');
      
      // Leave the room with WebRTC
      const success = await audioStreamService.leaveRoom();
      
      // Reset state regardless of success to ensure clean slate
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setCurrentRoomId(null);
      
      // Remove from local storage
      localStorage.removeItem('voice-room-id');
      
      if (success) {
        console.log('Successfully left voice chat');
        return true;
      } else {
        console.error('Failed to cleanly leave voice chat');
        return false;
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      
      // Reset state even on error
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setCurrentRoomId(null);
      
      return false;
    }
  };
  
  // Auto-reconnect to saved room if available
  useEffect(() => {
    if (currentUser && !isConnected && connectionStatus === 'disconnected') {
      const savedRoomId = localStorage.getItem('voice-room-id');
      
      if (savedRoomId) {
        console.log(`Attempting to reconnect to room: ${savedRoomId}`);
        joinRoom(savedRoomId).catch(err => {
          console.error("Failed to auto-reconnect:", err);
          localStorage.removeItem('voice-room-id');
        });
      }
    }
  }, [currentUser, isConnected, connectionStatus]);
  
  // Debug info
  const getDebugInfo = () => {
    return {
      ...audioStreamService.getStreamState(),
      isListening,
      isMuted,
      isUserSpeaking,
      activeSpeakers,
      isConnected,
      connectionStatus,
      currentRoomId,
    };
  };
  
  // Approve a speaker request
  const approveSpeaker = (userId: string): boolean => {
    return audioStreamService.approveSpeaker(userId);
  };
  
  // Reject a speaker request
  const rejectSpeaker = (userId: string): boolean => {
    return audioStreamService.rejectSpeaker(userId);
  };
  
  // Block a speaker
  const blockSpeaker = (userId: string): boolean => {
    return audioStreamService.blockSpeaker(userId);
  };
  
  return (
    <AudioContext.Provider
      value={{
        isListening,
        isMuted,
        activeSpeakers,
        startListening,
        stopListening,
        toggleMute,
        isUserSpeaking,
        joinRoom,
        leaveRoom,
        isConnected,
        connectionStatus,
        currentRoomId,
        requestsToSpeak,
        approveSpeaker,
        rejectSpeaker,
        blockSpeaker
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
