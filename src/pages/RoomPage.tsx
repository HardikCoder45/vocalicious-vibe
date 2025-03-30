import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '@/context/RoomContext';
import { useUser } from '@/context/UserContext';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, Share, Heart, MessageSquare, Users, Mic, MicOff, 
  Volume2, VolumeX, Shield, Bell, UserPlus, X, Check, Lock 
} from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Avatar from '@/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import { motion, AnimatePresence } from 'framer-motion';
import * as audioStreamService from '@/services/audioStreamService';
import LiveCaptions from '@/components/LiveCaptions';
import * as transcriptionService from '@/services/transcriptionService';
import { nanoid } from 'nanoid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RoomNotifications, { Notification } from '@/components/RoomNotifications';
import { supabase } from '@/integrations/supabase/client';

// Global state to prevent multiple cleanups
const cleanupState = {
  isCleaningUp: false
};

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { rooms, currentRoom, joinRoom, leaveRoom, toggleSpeaking, isLoading: roomsLoading } = useRoom();
  const { isAuthenticated, currentUser } = useUser();
  const { 
    isListening, 
    startListening, 
    stopListening, 
    activeSpeakers, 
    isMuted,
    toggleMute,
    isUserSpeaking,
    connectionStatus
  } = useAudio();
  
  // If we're already in this room, skip loading state
  const [isLoading, setIsLoading] = useState(() => 
    !(currentRoom && currentRoom.id === roomId)
  );
  const [isJoining, setIsJoining] = useState(() => 
    !(currentRoom && currentRoom.id === roomId)
  );
  const [isVoiceConnected, setIsVoiceConnected] = useState(connectionStatus === 'connected');
  const [liked, setLiked] = useState(false);
  const [joinAttempts, setJoinAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Joining room...");
  
  const audioVisualizerTimer = useRef<number | null>(null);
  const maxJoinAttempts = 3;
  const connectionRetryRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const lastJoinAttemptRef = useRef<number>(0);
  
  const [captions, setCaptions] = useState<any[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  
  // Moderator system state
  const [speakerRequests, setSpeakerRequests] = useState<{userId: string; username: string}[]>([]);
  const [showSpeakerRequests, setShowSpeakerRequests] = useState(false);
  const [recentJoins, setRecentJoins] = useState<{userId: string; username: string}[]>([]);
  const [blockedSpeakers, setBlockedSpeakers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Update the check for moderator and speaker status to use user_profiles table
  const [isModerator, setIsModerator] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  // Effect to fetch user's moderator and speaker status from user_profiles
  useEffect(() => {
    if (!currentUser) return;
    
    // Check user_profiles table for status
    const checkUserStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_moderator, is_speaker')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user status:', error);
          return;
        }
        
        // Update state based on database values
        setIsModerator(data.is_moderator || false);
        setIsSpeaker(data.is_speaker || false);
        
        // Room creator is always a moderator
        if (currentRoom?.created_by === currentUser.id) {
          setIsModerator(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUserStatus();
    
    // Also listen for changes via Supabase realtime
    const userStatusSubscription = supabase
      .channel('user_profile_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${currentUser.id}`
      }, (payload) => {
        // Update state when data changes
        const newData = payload.new as { is_moderator: boolean; is_speaker: boolean };
        setIsModerator(newData.is_moderator || false);
        setIsSpeaker(newData.is_speaker || false);
      })
      .subscribe();
      
    return () => {
      userStatusSubscription.unsubscribe();
    };
  }, [currentUser, currentRoom, supabase]);
  
  // Instead of checking speakers, use the state values from user_profiles
  const isUserSpeakerInRoom = isSpeaker;
  const isUserModeratorInRoom = isModerator;
  
  // Function to establish voice connection
  const connectToVoiceRoom = useCallback(async () => {
    if (!currentUser || !roomId) return false;
    
    try {
      setStatusMessage("Connecting voice chat...");
      
      // Start local audio system first
      await startListening();
      
      // Connect to voice room with moderator and speaker status from state
      const success = await audioStreamService.joinRoom(
        roomId,
        currentUser.id,
        (currentUser as any).username || (currentUser as any).name || 'Anonymous',
        (currentUser as any).avatar_url,
        isUserModeratorInRoom,
        isUserSpeakerInRoom
      );
      
      if (success) {
        setIsVoiceConnected(true);
        setStatusMessage("Voice connected successfully");
        toast.success("Voice chat connected");
        
        // Set up callbacks for moderator features
        audioStreamService.setSpeakRequestsCallback((requests) => {
          setSpeakerRequests(requests);
          
          // Check if the current user is a moderator
          if (requests.length > 0 && isUserModeratorInRoom) {
            setShowSpeakerRequests(true);
          }
        });
        
        audioStreamService.setUserJoinedCallback((user) => {
          // Add notification
          const notification: Notification = {
            id: nanoid(),
            type: 'userJoined',
            userId: user.userId,
            username: user.username,
            timestamp: Date.now()
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 10));
          
          // Remove notification after 10 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => 
              !(n.type === 'userJoined' && n.userId === user.userId)
            ));
          }, 10000);
        });
        
        audioStreamService.setUserLeftCallback((user) => {
          // Add notification
          const notification: Notification = {
            id: nanoid(),
            type: 'userLeft',
            userId: user.userId,
            username: user.username,
            timestamp: Date.now()
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 10));
          
          // Remove notification after 10 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => 
              !(n.type === 'userLeft' && n.userId === user.userId)
            ));
          }, 10000);
        });
        
        return true;
      } else {
        setIsVoiceConnected(false);
        setStatusMessage("Voice connection failed");
        return false;
      }
    } catch (error) {
      console.error("Voice connection error:", error);
      setIsVoiceConnected(false);
      setStatusMessage("Voice connection error");
      return false;
    }
  }, [roomId, currentUser, startListening, isUserModeratorInRoom, isUserSpeakerInRoom]);
  
  // Function to handle the whole room joining process
  const handleRoomJoin = useCallback(async () => {
    if (!roomId || !isAuthenticated || !currentUser) return;
    
    // Skip if we've already attempted to join this room in this component instance
    if (hasJoinedRef.current) {
      console.log('Join already attempted in this component instance, skipping');
      return;
    }
    
    // Skip if we're already in this room
    if (currentRoom && currentRoom.id === roomId) {
      console.log('Already in this room, skipping join');
      setIsLoading(false);
      setIsJoining(false);
      return;
    }
    
    // Rate limit attempts - only allow one attempt every 2 seconds
    const now = Date.now();
    const lastJoinTime = joinAttempts > 0 ? lastJoinAttemptRef.current : 0;
    if (now - lastJoinTime < 2000) {
      console.log('Join attempt too soon after previous attempt, waiting...');
      const remainingTime = 2000 - (now - lastJoinTime);
      toast.info(`Please wait ${Math.ceil(remainingTime/1000)} second(s) before trying again`);
      return;
    }
    
    setIsLoading(true);
    setIsJoining(true);
    setError(null);
    
    try {
      // Mark that we're attempting to join
      hasJoinedRef.current = true;
      lastJoinAttemptRef.current = Date.now();
      
      // Step 1: Join the room database entry
      setStatusMessage("Joining room...");
      console.log('Attempting to join room:', roomId);
      await joinRoom(roomId);
      
      // Short delay for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Connect to voice chat
      setStatusMessage("Establishing voice connection...");
      const voiceSuccess = await connectToVoiceRoom();
      
      if (!voiceSuccess) {
        toast.warning("Room joined but voice chat couldn't connect");
      }
      
      // Complete the joining process
      setIsLoading(false);
      setIsJoining(false);
      
    } catch (error: any) {
      console.error('Error joining room:', error);
      setJoinAttempts(prev => prev + 1);
      
      // Handle specific error cases
      if (error.message.includes('not found') || error.message.includes('ended')) {
        setError('This room no longer exists or has ended');
      } else if (error.message.includes('not started yet')) {
        setError('This room is scheduled to start later');
      } else {
        setError('Unable to join this room. Please try again later.');
      }
      
      // Retry joining a limited number of times
      if (joinAttempts < maxJoinAttempts) {
        const retryDelay = 2000 * Math.pow(2, joinAttempts); // Exponential backoff
        toast.info(`Connection issue. Retrying in ${retryDelay/1000} seconds...`);
        
        connectionRetryRef.current = setTimeout(() => {
          if (!currentRoom) {
            // Reset join status for retry
            hasJoinedRef.current = false;
            handleRoomJoin();
          }
        }, retryDelay);
      } else {
        setIsLoading(false);
        setIsJoining(false);
        toast.error('Failed to join room after multiple attempts');
        
        // Add a short delay before redirecting for better UX
        setTimeout(() => navigate('/'), 3000);
      }
    }
  }, [roomId, joinRoom, connectToVoiceRoom, isAuthenticated, currentUser, currentRoom, joinAttempts, navigate]);
  
  // Initialize room join on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/room/${roomId}` } });
      return;
    }

    // Check if we're in a throttling period
    const isThrottled = sessionStorage.getItem('room_throttle') === 'true';
    if (isThrottled) {
      console.log('Room join throttled, waiting for cooldown');
      setStatusMessage("Room join throttled, please wait...");
      setIsLoading(false);
      setIsJoining(false);
      return; // Skip joining during throttle period
    }

    // Only join if not already in the room
    if (!currentRoom || currentRoom.id !== roomId) {
      // Add a guard to prevent multiple calls
      if (!hasJoinedRef.current) {
        handleRoomJoin();
      } else {
        console.log('Join already attempted for this room instance');
        setIsLoading(false);
        setIsJoining(false);
      }
    } else {
      // We're already in the room
      console.log('Already in this room, skipping join');
      setIsLoading(false);
      setIsJoining(false);
    }
    
    // Cleanup when leaving
    return () => {
      console.log('RoomPage cleanup triggered');
      
      // Prevent multiple cleanup operations
      if (cleanupState.isCleaningUp) {
        console.log('Cleanup already in progress, skipping');
        return;
      }
      
      cleanupState.isCleaningUp = true;
      
      if (audioVisualizerTimer.current) {
        clearInterval(audioVisualizerTimer.current);
      }
      
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
      
      try {
        // Check if we're just navigating to the same room with different route parameters
        const currentPath = window.location.pathname;
        const isNavigatingToSameRoom = currentPath.includes(`/room/${roomId}`);
        
        if (isNavigatingToSameRoom) {
          console.log('Navigating to the same room, skipping audio cleanup');
          // Just clean up flags, don't disconnect
          setTimeout(() => {
            cleanupState.isCleaningUp = false;
          }, 500);
          return;
        }
        
        // Send explicit leave event before disconnecting to ensure server knows
        if (currentRoom && currentRoom.id === roomId) {
          console.log('Sending explicit leave event');
          audioStreamService.leaveRoom();
          
          // Add a small delay before stopping listening to ensure leave message is sent
          setTimeout(() => {
            stopListening();
            leaveRoom();
            cleanupState.isCleaningUp = false;
          }, 500);
        } else {
          stopListening();
          leaveRoom();
          cleanupState.isCleaningUp = false;
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
        cleanupState.isCleaningUp = false;
      }
    };
  }, [roomId, isAuthenticated, navigate, handleRoomJoin, leaveRoom, stopListening, currentRoom]);
  
  // For reconnecting voice if it disconnects
  useEffect(() => {
    if (currentRoom && !isVoiceConnected && !isJoining && !isLoading) {
      // Voice reconnection logic
      const reconnectVoice = async () => {
        toast.info("Attempting to reconnect voice chat...");
        await connectToVoiceRoom();
      };
      
      // Only auto-reconnect once
      reconnectVoice();
    }
  }, [currentRoom, isVoiceConnected, isJoining, isLoading, connectToVoiceRoom]);
  
  // Prevent navigation loops - if we're already in the room, don't process effects again
  useEffect(() => {
    // If we navigate to the room we're already in, just update the UI state
    if (currentRoom && currentRoom.id === roomId && isLoading) {
      setIsLoading(false);
      setIsJoining(false);
      console.log('Already in room, updating UI state');
    }
  }, [currentRoom, roomId, isLoading]);
  
  // Add an effect to prevent rapid subscription changes
  useEffect(() => {
    const lastNavigationTime = sessionStorage.getItem('last_room_navigation');
    const now = Date.now();
    
    if (lastNavigationTime) {
      const elapsed = now - parseInt(lastNavigationTime);
      if (elapsed < 2000) { // Less than 2 seconds since last navigation
        console.log(`Navigation throttled: ${elapsed}ms since last navigation`);
      }
    }
    
    // Update the last navigation time
    sessionStorage.setItem('last_room_navigation', now.toString());
    
    // This helps detect if the component is being unmounted and remounted rapidly
    return () => {
      const unmountTime = Date.now();
      const mountDuration = unmountTime - now;
      if (mountDuration < 1000) { // Component mounted for less than 1 second
        console.log(`Warning: Rapid component remount detected. Duration: ${mountDuration}ms`);
        // Add a small delay to prevent thrashing
        sessionStorage.setItem('room_throttle', 'true');
        setTimeout(() => {
          sessionStorage.removeItem('room_throttle');
        }, 2000);
      }
    }
  }, [roomId]);
  
  // Update voice connection status based on AudioContext
  useEffect(() => {
    setIsVoiceConnected(connectionStatus === 'connected');
    
    if (connectionStatus === 'connected') {
      setStatusMessage("Voice chat connected");
    } else if (connectionStatus === 'connecting') {
      setStatusMessage("Establishing voice connection...");
    } else {
      setStatusMessage("Connecting to voice chat...");
    }
  }, [connectionStatus]);
  
  // Add a beforeunload event listener to handle tab/browser closes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only if we're in a room, try to notify server before closing
      if (currentRoom && currentRoom.id === roomId) {
        // Sync attempt to leave room
        try {
          console.log('Browser closing, sending leave notification');
          // Use sendBeacon if available for more reliable delivery during page unload
          if (navigator.sendBeacon) {
            const leaveData = new FormData();
            leaveData.append('userId', currentUser?.id || '');
            leaveData.append('roomId', roomId || '');
            navigator.sendBeacon('/api/leave-room', leaveData);
          } else {
            // Fallback to sync XHR
            audioStreamService.leaveRoom();
          }
        } catch (err) {
          console.error('Error during unload cleanup:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentRoom, roomId, currentUser]);
  
  // Helper function to add a notification
  const addNotification = useCallback((type: Notification['type'], userId: string, username: string, message?: string) => {
    const notification: Notification = {
      id: nanoid(),
      type,
      userId,
      username,
      timestamp: Date.now(),
      message
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only the last 10 notifications
  }, []);
  
  // Handle speaker request from a listener
  const handleRequestToSpeak = async () => {
    if (!currentUser || !currentRoom) return;
    
    // If already a speaker, stop speaking
    if (isUserSpeakerInRoom) {
      console.log("User is already a speaker, stopping speaking");
      try {
        await toggleSpeaking(currentUser.id);
        
        // Also update the user_profiles table
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_speaker: false })
          .eq('id', currentUser.id);
          
        if (error) {
          console.warn('Error updating user profile speaker status:', error);
        }
      } catch (error) {
        console.error('Error toggling speaking status:', error);
        toast.error('Could not update speaking status');
      }
      return;
    }
    
    // If user is moderator, they can start speaking immediately
    if (isUserModeratorInRoom) {
      console.log("User is a moderator, starting speaking directly");
      try {
        await toggleSpeaking(currentUser.id);
        
        // Also update the user_profiles table
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_speaker: true })
          .eq('id', currentUser.id);
          
        if (error) {
          console.warn('Error updating user profile speaker status:', error);
        }
      } catch (error) {
        console.error('Error toggling speaking status:', error);
        toast.error('Could not update speaking status');
      }
      return;
    }
    
    console.log("User is requesting to speak");
    
    // Find moderators in the room based on user_profiles
    const { data: moderators, error: moderatorError } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', currentRoom.id)
      .eq('is_moderator', true);
      
    if (moderatorError) {
      console.error('Error finding room moderators:', moderatorError);
      toast.error('Could not find room moderators');
      return;
    }
    
    if (!moderators || moderators.length === 0) {
      toast.error("No moderators available to approve your request");
      return;
    }
    
    // Use the audioStreamService to request to speak
    try {
      const username = (currentUser as any).username || 
                       (currentUser as any).name || 
                       currentUser.email?.split('@')[0] || 
                       'Anonymous';
      
      const success = audioStreamService.requestToSpeak(
        currentRoom.id,
        currentUser.id,
        username
      );
      
      if (success) {
        toast.success("Request to speak sent to moderators");
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Error sending speak request:", error);
      toast.error("Could not send speak request due to a connection issue");
    }
  };
  
  // Approve a speaker request (moderator only)
  const handleApproveSpeaker = async (userId: string) => {
    if (!isUserModeratorInRoom || !currentRoom) {
      toast.error("Only moderators can approve speakers");
      return;
    }
    
    try {
      // First approve via socket
      const success = audioStreamService.approveSpeaker(userId);
      
      if (success) {
        // Update room_participants table
        await toggleSpeaking(userId);
        toast.success("Speaker approved");
        
        // Update user_profiles table
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .update({ is_speaker: true })
          .eq('id', userId);
          
        if (userProfileError) {
          console.warn('Error updating user profile speaker status:', userProfileError);
        }
        
        // Find the username for the notification
        const speakerRequest = speakerRequests.find(req => req.userId === userId);
        if (speakerRequest) {
          // Add notification
          addNotification('speakerAdded', userId, speakerRequest.username);
        }
        
        // Remove from requests
        setSpeakerRequests(prev => prev.filter(req => req.userId !== userId));
      } else {
        toast.error("Failed to approve speaker");
      }
    } catch (error) {
      console.error("Error approving speaker:", error);
      toast.error("Could not approve speaker");
    }
  };
  
  // Reject a speaker request (moderator only)
  const handleRejectSpeaker = async (userId: string) => {
    if (!isUserModeratorInRoom) {
      toast.error("Only moderators can reject speakers");
      return;
    }
    
    try {
      const success = audioStreamService.rejectSpeaker(userId);
      
      if (success) {
        toast.success("Speaker request rejected");
        
        // Ensure user_profiles is_speaker is false
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .update({ is_speaker: false })
          .eq('id', userId);
          
        if (userProfileError) {
          console.warn('Error updating user profile speaker status:', userProfileError);
        }
        
        // Remove from requests
        setSpeakerRequests(prev => prev.filter(req => req.userId !== userId));
      } else {
        toast.error("Failed to reject speaker");
      }
    } catch (error) {
      console.error("Error rejecting speaker:", error);
      toast.error("Could not reject speaker");
    }
  };
  
  // Block a speaker (mute them) - moderator only
  const handleBlockSpeaker = async (speakerId: string) => {
    if (!isUserModeratorInRoom) {
      toast.error("Only moderators can block speakers");
      return;
    }
    
    try {
      const success = audioStreamService.blockSpeaker(speakerId);
      
      if (success) {
        toast.success("Speaker has been muted");
        setBlockedSpeakers(prev => [...prev, speakerId]);
        
        // Update user_profiles to set is_speaker to false
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .update({ is_speaker: false })
          .eq('id', speakerId);
          
        if (userProfileError) {
          console.warn('Error updating user profile speaker status:', userProfileError);
        }
        
        // Also update room_participants
        const { error: roomParticipantError } = await supabase
          .from('room_participants')
          .update({ is_speaking: false })
          .eq('room_id', currentRoom?.id || '')
          .eq('user_id', speakerId);
          
        if (roomParticipantError) {
          console.warn('Error updating room participant speaking status:', roomParticipantError);
        }
        
        // Find the speaker name for the notification
        const speaker = currentRoom?.speakers.find(s => s.id === speakerId);
        if (speaker) {
          addNotification('moderatorAction', speakerId, speaker.name, `${speaker.name} has been muted by a moderator`);
        }
      } else {
        toast.error("Failed to mute speaker");
      }
    } catch (error) {
      console.error("Error blocking speaker:", error);
      toast.error("Could not mute speaker");
    }
  };
  
  // Unblock a speaker (unmute them) - moderator only
  const handleUnblockSpeaker = async (speakerId: string) => {
    if (!isUserModeratorInRoom) {
      toast.error("Only moderators can unblock speakers");
      return;
    }
    
    try {
      setBlockedSpeakers(prev => prev.filter(id => id !== speakerId));
      
      // Find if this user was a moderator (moderators should be speakers)
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('is_moderator')
        .eq('id', speakerId)
        .single();
        
      if (userError) {
        console.warn('Error checking user status:', userError);
      }
      
      const isModerator = userData?.is_moderator || false;
      
      // Update user_profiles to set is_speaker back to true if they are a moderator
      if (isModerator) {
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .update({ is_speaker: true })
          .eq('id', speakerId);
          
        if (userProfileError) {
          console.warn('Error updating user profile speaker status:', userProfileError);
        }
        
        // Also update room_participants
        const { error: roomParticipantError } = await supabase
          .from('room_participants')
          .update({ is_speaking: true })
          .eq('room_id', currentRoom?.id || '')
          .eq('user_id', speakerId);
          
        if (roomParticipantError) {
          console.warn('Error updating room participant speaking status:', roomParticipantError);
        }
      }
      
      toast.success("Speaker has been unmuted");
      
      // Find the speaker name for the notification
      const speaker = currentRoom?.speakers.find(s => s.id === speakerId);
      if (speaker) {
        addNotification('moderatorAction', speakerId, speaker.name, `${speaker.name} has been unmuted by a moderator`);
      }
    } catch (error) {
      console.error("Error unblocking speaker:", error);
      toast.error("Could not unmute speaker");
    }
  };
  
  const handleBack = () => {
    // Set loading state to prevent UI interaction during cleanup
    setIsLoading(true);
    
    // Clean up in proper sequence
    try {
      audioStreamService.leaveRoom();
      
      // Small delay to ensure leave message is processed
      setTimeout(() => {
        stopListening();
        leaveRoom();
        navigate('/');
      }, 300);
    } catch (error) {
      console.error('Error leaving room:', error);
      // Force navigation even on error
      navigate('/');
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Room link copied to clipboard");
  };
  
  const handleLike = () => {
    setLiked(!liked);
    toast(liked ? "Removed like" : "You liked this room!");
  };
  
  const handleMuteToggle = () => {
    toggleMute();
    toast(isMuted ? "Microphone unmuted" : "Microphone muted");
  };
  
  // Handle click on a speaker
  const handleSpeakerClick = (speakerId: string) => {
    if (speakerId === currentUser?.id) {
      // Users can toggle their own speaking state
      toggleSpeaking(speakerId);
    } else if (isUserModeratorInRoom) {
      // Moderators can manage other speakers
      // Show options dialog for moderator actions on speakers
      const speaker = currentRoom?.speakers.find(s => s.id === speakerId);
      if (speaker) {
        const isBlocked = blockedSpeakers.includes(speakerId);
        
        if (isBlocked) {
          handleUnblockSpeaker(speakerId);
        } else {
          handleBlockSpeaker(speakerId);
        }
      }
    } else {
      toast.info('Only moderators can manage speakers');
    }
  };
  
  // Function to handle transcription results
  const handleTranscription = useCallback((transcription: any) => {
    // Generate a unique ID for this transcription if it's a new one
    const transcriptionWithId = {
      ...transcription,
      id: transcription.id || nanoid(),
    };
    
    setCaptions(prev => {
      // If this is an interim result from the same speaker, update it
      if (!transcription.isFinal) {
        // Remove any existing interim results from this user
        const filtered = prev.filter(c => 
          c.userId !== transcription.userId || c.isFinal
        );
        return [...filtered, transcriptionWithId];
      }
      
      // If this is a final result, add it and cleanup old ones
      // Remove any interim results from this user
      const filtered = prev.filter(c => 
        c.userId !== transcription.userId || c.isFinal
      );
      
      // Add the final result and limit to the last 20 messages
      return [...filtered, transcriptionWithId].slice(-20);
    });
  }, []);
  
  // Toggle captions on/off
  const toggleCaptions = useCallback(() => {
    const newState = !captionsEnabled;
    setCaptionsEnabled(newState);
    
    if (newState && currentUser) {
      // Start transcription
      transcriptionService.startTranscription(
        currentUser.id,
        (currentUser as any).username || (currentUser as any).name || 'Anonymous',
        {
          onTranscription: handleTranscription,
          onError: (error) => {
            console.error('Transcription error:', error);
            if (error === 'no-speech' || error === 'aborted') {
              // These are common and don't need toasts
              return;
            }
            toast.error('Transcription error: ' + error);
          }
        }
      );
    } else {
      // Stop transcription
      transcriptionService.stopTranscription();
    }
    
    toast(newState ? 'Captions enabled' : 'Captions disabled');
  }, [captionsEnabled, currentUser, handleTranscription]);
  
  // Clean up transcription when leaving
  useEffect(() => {
    return () => {
      transcriptionService.stopTranscription();
    };
  }, []);
  
  // Speaker requests dialog component
  const SpeakerRequestsDialog = () => (
    <Dialog open={showSpeakerRequests} onOpenChange={setShowSpeakerRequests}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Speaker Requests</DialogTitle>
          <DialogDescription>
            Users who want to speak in this room
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[300px] overflow-y-auto py-4">
          {speakerRequests.length === 0 ? (
            <p className="text-center text-muted-foreground">No pending requests</p>
          ) : (
            speakerRequests.map((request) => (
              <div key={request.userId} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Avatar 
                    src={null} 
                    alt={request.username} 
                    size="sm" 
                    id={request.userId}
                    userId={request.userId}
                  />
                  <span>{request.username}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRejectSpeaker(request.userId)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleApproveSpeaker(request.userId)}
                    className="text-green-500 hover:text-green-500/80"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // Recent joins notification component - replaced with RoomNotifications
  const RecentJoinsNotification = () => {
    if (recentJoins.length === 0) return null;
    
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed top-20 right-4 space-y-2 z-50 max-w-sm"
          key="recent-joins"
        >
          {recentJoins.map((user) => (
            <motion.div
              key={`join-${user.userId}`}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-card p-3 rounded-md shadow-md border flex items-center gap-2"
            >
              <Avatar 
                src={null} 
                alt={user.username} 
                size="sm" 
                id={user.userId}
                userId={user.userId}
              />
              <span className="text-sm">{user.username} joined the room</span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  };
  
  if (!currentRoom && !isLoading && !roomsLoading && error) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-screen p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 shadow-lg">
          <CardContent className="flex flex-col items-center space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-2">Room not available</h2>
              <p className="mb-8 text-muted-foreground">{error}</p>
            </motion.div>
            
            <motion.div 
              className="space-y-4 w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button onClick={() => navigate('/')} size="lg" className="w-full">Back to home</Button>
              <Button onClick={() => navigate('/create-room')} variant="outline" className="w-full">Create a new room</Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="min-h-screen w-full pb-16 md:pl-16 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ParticleBackground particleCount={50} />
      
      {/* Speaker requests dialog */}
      <SpeakerRequestsDialog />
      
      {/* Room notifications */}
      <RoomNotifications notifications={notifications} maxNotifications={3} />
      
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {!isLoading && currentRoom && (
            <div>
              <h1 className="text-lg font-semibold">{currentRoom.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentRoom.topic}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentRoom.participants} listening
                </span>
                
                {isVoiceConnected ? (
                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                    Voice Connected
                  </Badge>
                ) : connectionStatus === 'connecting' ? (
                  <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500">
                    Voice Connecting...
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-500">
                    Voice Disconnected
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="animate-pulse">
              <div className="h-6 w-40 bg-muted rounded mb-1"></div>
              <div className="h-4 w-24 bg-muted rounded"></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isUserModeratorInRoom && speakerRequests.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSpeakerRequests(true)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {speakerRequests.length}
              </span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleMuteToggle}
            className={isMuted ? 'text-red-500' : ''}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLike} className={liked ? 'text-red-500' : ''}>
            <Heart className={`h-5 w-5 transition-transform ${liked ? 'fill-current animate-scale-in' : ''}`} />
          </Button>
        </div>
      </header>
      
      <main className="px-4 py-8 md:px-8 max-w-5xl mx-auto">
        {isLoading || isJoining ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Mic className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </motion.div>
              
              <motion.h2 
                className="text-xl font-semibold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {statusMessage}
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Setting up your audio connection
              </motion.p>
              
              <motion.div
                className="flex justify-center gap-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="h-2 w-2 bg-primary rounded-full animate-wave" />
                <div className="h-2 w-2 bg-primary rounded-full animate-wave-delay-1" />
                <div className="h-2 w-2 bg-primary rounded-full animate-wave-delay-2" />
                <div className="h-2 w-2 bg-primary rounded-full animate-wave-delay-3" />
                <div className="h-2 w-2 bg-primary rounded-full animate-wave-delay-4" />
              </motion.div>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Speakers</h2>
                {isUserModeratorInRoom && (
                  <Badge variant="outline" className="bg-primary/10 font-semibold flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Moderator
                  </Badge>
                )}
              </div>
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatePresence>
                  {currentRoom?.speakers.map((speaker) => (
                    <motion.div 
                      key={speaker.id}
                      className="flex flex-col items-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="relative mb-2" onClick={() => handleSpeakerClick(speaker.id)}>
                        <Avatar 
                          src={speaker.avatar} 
                          alt={speaker.name} 
                          size="lg" 
                          speaking={speaker.isSpeaking}
                          active={speaker.isModerator}
                          id={speaker.id}
                          userId={speaker.id}
                        />
                        {blockedSpeakers.includes(speaker.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                            <Lock className="h-6 w-6 text-destructive" />
                          </div>
                        )}
                        {speaker.isSpeaking && !blockedSpeakers.includes(speaker.id) && (
                          <div className="absolute -bottom-1 left-0 right-0 flex justify-center">
                            <div className="w-16 h-6">
                              <WaveformVisualizer 
                                isSpeaking={activeSpeakers.includes(speaker.id) || 
                                  (speaker.id === currentUser?.id && isUserSpeaking)} 
                                color="bg-primary"
                                barCount={5}
                              />
                            </div>
                          </div>
                        )}
                        {speaker.isModerator && (
                          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                              <Shield className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate max-w-full">{speaker.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {speaker.isModerator ? 'Moderator' : speaker.isSpeaking ? 'Speaker' : 'Listener'}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Listeners</h2>
              {currentRoom?.listeners && currentRoom.listeners.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <AnimatePresence>
                    {currentRoom.listeners.map((listener) => (
                      <motion.div 
                        key={listener.id}
                        className="flex flex-col items-center"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Avatar 
                          src={listener.avatarUrl} 
                          alt={listener.name} 
                          size="md" 
                          className="mb-2"
                        />
                        <p className="text-xs font-medium truncate max-w-full">{listener.name}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <p className="text-muted-foreground">No listeners yet</p>
              )}
            </section>
          </>
        )}
      </main>
      
      <LiveCaptions 
        messages={captions}
        isEnabled={captionsEnabled}
        onToggle={toggleCaptions}
      />
      
      <div className="fixed bottom-0 left-0 right-0 md:left-16 bg-background/80 backdrop-blur-sm border-t p-4 flex justify-center">
        <div className="flex items-center gap-4">
          <Button
            variant={isUserSpeakerInRoom ? "default" : "outline"}
            size="lg"
            onClick={handleRequestToSpeak}
            className={`rounded-full ${isUserSpeakerInRoom ? 'bg-primary hover:bg-primary/90' : ''}`}
          >
            {isUserSpeakerInRoom ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Speaking
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                {isUserModeratorInRoom ? "Start Speaking" : "Request to Speak"}
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full" 
            onClick={handleMuteToggle}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          <Button variant="destructive" size="icon" className="rounded-full" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant={captionsEnabled ? "default" : "outline"} 
            size="icon" 
            className="rounded-full" 
            onClick={toggleCaptions}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          {isUserModeratorInRoom && speakerRequests.length > 0 && (
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full relative" 
              onClick={() => setShowSpeakerRequests(true)}
            >
              <UserPlus className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {speakerRequests.length}
              </span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoomPage;
