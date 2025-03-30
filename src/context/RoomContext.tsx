import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";
import { useAudio } from "./AudioContext";
import { prefetchAvatars } from '@/utils/avatarUtils';

// Configure Supabase for more reliable realtime connections
supabase.removeAllChannels();

// Types
export interface Speaker {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isModerator: boolean;
  isSpeaking: boolean;
}

export interface Listener {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  participants: number;
  topic: string;
  speakers: Speaker[];
  listeners?: Listener[]; // Optional array of listeners
  coverImage: string;
  color: string;
  isLive: boolean;
  created_by: string;
  created_at: string;
  scheduled_for?: string; // Optional date for upcoming rooms
}

interface RoomContextType {
  rooms: RoomData[];
  upcomingRooms: RoomData[];
  currentRoom: RoomData | null;
  fetchRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  createRoom: (roomData: Partial<RoomData>) => Promise<string>;
  toggleSpeaking: (speakerId: string) => Promise<void>;
  isLoading: boolean;
}

// Create context
const RoomContext = createContext<RoomContextType>({
  rooms: [],
  upcomingRooms: [],
  currentRoom: null,
  fetchRooms: async () => {},
  joinRoom: async () => {},
  leaveRoom: async () => {},
  createRoom: async () => { return ''; },
  toggleSpeaking: async () => {},
  isLoading: false,
});

export const useRoom = () => useContext(RoomContext);

export const RoomProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [upcomingRooms, setUpcomingRooms] = useState<RoomData[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [joinAttempts, setJoinAttempts] = useState<Record<string, number>>({});
  const [joinInProgress, setJoinInProgress] = useState<boolean>(false);
  const { currentUser, profile } = useUser();
  const joiningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinCooldownRef = useRef<boolean>(false);
  const lastJoinAttemptRef = useRef<number>(0);
  const roomRestoredRef = useRef<boolean>(false);
  const { joinRoom: joinAudioRoom, leaveRoom: leaveAudioRoom } = useAudio();
  
  // Helper function to process room data
  const processRoomData = async (roomsData: any[]) => {
    if (!roomsData || roomsData.length === 0) {
      return [];
    }
    
    const roomsWithDetails = await Promise.all(
      roomsData.filter(room => room !== null).map(async (room) => {
        try {
          // Extract room participants
          const participants = room.room_participants || [];
          const participantsCount = participants.length || 0;
          
          // Get unique user IDs from participants
          const userIds = [...new Set(participants.map((p: any) => p.user_id).filter(Boolean) as string[])];
          
          // Fetch user profiles for all participants
          let speakersWithDetails: Speaker[] = [];
          
          if (userIds.length > 0) {
            try {
              const { data: userProfiles, error: userError } = await supabase
                .from('user_profiles')
                .select('*')
                .in('id', userIds);
              
              if (userError) {
                console.error('Error fetching user profiles:', userError);
              } else if (userProfiles) {
                // Map participant data with user profiles
                speakersWithDetails = participants.map((participant: any) => {
                  const userProfile = userProfiles.find((u: any) => u.id === participant.user_id);
                  
                  if (!userProfile) {
                    return {
                      id: participant.user_id,
                      name: `User ${participant.user_id.substring(0, 5)}`,
                      username: `user_${participant.user_id.substring(0, 5)}`,
                      avatar: '/placeholder.svg',
                      isModerator: participant.is_moderator || false,
                      isSpeaking: participant.is_speaking || false
                    };
                  }
                  
                  const userDetails = {
                    id: userProfile.id,
                    name: userProfile.username || `User ${userProfile.id.substring(0, 5)}`,
                    username: userProfile.username || `user_${userProfile.id.substring(0, 5)}`,
                    avatar: userProfile.avatar_url || '/placeholder.svg',
                    isModerator: participant.is_moderator || false,
                    isSpeaking: participant.is_speaking || false
                  };

                  return userDetails;
                });
              }
            } catch (error) {
              console.error('Error processing participants:', error);
              // Provide default speakers as fallback
              speakersWithDetails = [{
                id: 'default-speaker',
                name: 'Default Speaker',
                username: 'default_speaker',
                avatar: '/placeholder.svg',
                isModerator: true,
                isSpeaking: false
              }];
            }
          }
          
          // Parse theme data with robust error handling
          let theme = { topic: 'General', description: '', color: 'from-purple-500 to-pink-500' };
          try {
            if (room.theme && typeof room.theme === 'string') {
              // Handle potential JSON parsing errors
              theme = JSON.parse(room.theme);
            } else if (room.theme && typeof room.theme === 'object') {
              // Handle case where it's already an object
              theme = room.theme;
            }
            // Ensure all required fields exist
            theme.topic = theme.topic || 'General';
            theme.description = theme.description || '';
            theme.color = theme.color || 'from-purple-500 to-pink-500';
          } catch (e) {
            console.error('Error parsing room theme:', e, room.theme);
            // Use default theme if parsing fails
          }
          
          return {
            id: room.id,
            name: room.name || 'Unnamed Room',
            description: theme.description || '',
            participants: participantsCount,
            topic: theme.topic || 'General',
            speakers: speakersWithDetails,
            coverImage: '/placeholder.svg',
            color: theme.color || 'from-purple-500 to-pink-500',
            isLive: room.is_active === true,
            created_by: room.created_by || 'unknown',
            created_at: room.created_at || new Date().toISOString(),
            scheduled_for: room.scheduled_for || undefined
          };
        } catch (error) {
          console.error('Error processing room data:', error, room);
          return null;
        }
      })
    );
    
    // Filter out any null rooms and return
    return roomsWithDetails.filter((room) => room !== null) as RoomData[];
  };
  
  // Memoize the fetchRooms function to avoid useEffect dependency issues
  const fetchRooms = useCallback(async () => {
    // Throttle fetches to at most once every 3 seconds unless forced
    const now = Date.now();
    if (now - lastFetchTime < 3000) {
      console.log('Skipping fetchRooms due to rate limiting');
      return;
    }
    
    try {
      console.log('Fetching rooms...');
      setIsLoading(true);
      setLastFetchTime(now);
      
      // Fetch active rooms with their participants
      const { data: liveRoomsData, error: liveError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_participants(*)
        `)
        .is('scheduled_for', null)
        .eq('is_active', true);
        
      if (liveError) {
        console.error('Error fetching live rooms:', liveError);
        throw liveError;
      }
      
      // Fetch upcoming rooms
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_participants(*)
        `)
        .not('scheduled_for', 'is', null)
        .eq('is_active', true);
      
      if (upcomingError) {
        console.error('Error fetching upcoming rooms:', upcomingError);
        throw upcomingError;
      }
      
      console.log(`Found ${liveRoomsData?.length || 0} live rooms and ${upcomingData?.length || 0} upcoming rooms`);
      
      // Process live rooms
      let liveRoomsWithDetails = [];
      try {
        liveRoomsWithDetails = await processRoomData(liveRoomsData || []);
      } catch (error) {
        console.error('Error processing live rooms:', error);
        liveRoomsWithDetails = [];
      }
      
      // Process upcoming rooms
      let upcomingRoomsWithDetails = [];
      try {
        upcomingRoomsWithDetails = await processRoomData(upcomingData || []);
      } catch (error) {
        console.error('Error processing upcoming rooms:', error);
        upcomingRoomsWithDetails = [];
      }
      
      // Filter out rooms with no participants or invalid data
      const validLiveRooms = liveRoomsWithDetails
        .filter(Boolean)
        .filter((room: RoomData) => room.speakers && room.speakers.length > 0) as RoomData[];
      
      const validUpcomingRooms = upcomingRoomsWithDetails
        .filter(Boolean)
        .filter((room: RoomData) => room.scheduled_for) as RoomData[];
      
      // Generate dummy rooms if no real data is available
      const dummyRooms = generateDummyRooms();
      const dummyUpcomingRooms = generateDummyUpcomingRooms();
      
      console.log('Valid rooms:', validLiveRooms.length, 'rooms available');
      console.log('Valid upcoming rooms:', validUpcomingRooms.length, 'upcoming rooms available');
      
      // Always set the rooms, using dummy data as fallback
      setRooms(validLiveRooms.length > 0 ? validLiveRooms : dummyRooms);
      
      // Always set upcoming rooms, using dummy data as fallback
      setUpcomingRooms(validUpcomingRooms.length > 0 ? validUpcomingRooms : dummyUpcomingRooms);
      
      // If we're in a room, update the current room data
      if (currentRoom) {
        const updatedRoom = validLiveRooms.find(room => room.id === currentRoom.id);
        if (updatedRoom) {
          setCurrentRoom(updatedRoom);
        }
      }

      // After rooms are fetched, prefetch avatars for all speakers
      try {
        // Extract all unique speaker IDs from rooms
        const speakerIds = [...liveRoomsWithDetails, ...upcomingRoomsWithDetails].flatMap(room => 
          room.speakers?.filter(speaker => speaker?.id).map(speaker => speaker.id) || []
        );
        
        if (speakerIds.length > 0) {
          console.log(`Prefetching avatars for ${speakerIds.length} speakers in RoomContext`);
          await prefetchAvatars(speakerIds);
        }
      } catch (error) {
        console.error('Error prefetching room avatars:', error);
        // Don't throw error here, allow rooms to load even if avatar prefetch fails
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Ensure we always have some data even if the fetch fails
      const dummyRooms = generateDummyRooms();
      const dummyUpcomingRooms = generateDummyUpcomingRooms();
      
      console.log('Using fallback dummy rooms due to error:', dummyRooms.length, 'rooms available');
      
      setRooms(dummyRooms);
      setUpcomingRooms(dummyUpcomingRooms);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime, currentRoom]);
  
  // Setup real-time room subscriptions
  useEffect(() => {
    let subscriptionsActive = false;
    let roomSubscription: any = null;
    let participantsSubscription: any = null;

    const setupRealtime = async () => {
      // Prevent multiple subscriptions
      if (subscriptionsActive) {
        console.log('Subscriptions already active, skipping setup');
        return;
      }

      // Initial fetch
      try {
        await fetchRooms();
      } catch (error) {
        console.error("Initial room fetch failed:", error);
      }

      // Create a stable channel reference to prevent repeated creation/removal
      try {
        console.log('Setting up real-time subscriptions...');
        subscriptionsActive = true;

        // Subscribe to changes with a more robust approach
        roomSubscription = supabase
          .channel('rooms-channel')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'rooms' 
          }, () => {
            console.log('Room change detected, fetching updates...');
            fetchRooms().catch(err => {
              console.error("Failed to fetch rooms after change:", err);
            });
          })
          .subscribe((status) => {
            console.log(`Room subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to room changes');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              console.warn(`Room subscription status: ${status}, will attempt to reconnect`);
              // Will attempt to reconnect on component re-render
              subscriptionsActive = false;
            }
          });
          
        // Subscribe to room_participants changes with a stable channel name
        participantsSubscription = supabase
          .channel('participants-channel')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'room_participants' 
          }, (payload) => {
            console.log("Room participants change detected:", payload);
            
            // Add proper type checking for payload.new
            if (currentRoom && payload.new && typeof payload.new === 'object' && 'room_id' in payload.new && payload.new.room_id === currentRoom.id) {
              console.log('Change affects current room, updating...');
              fetchRooms().catch(err => {
                console.error("Failed to fetch rooms after participant change:", err);
              });
            }
          })
          .subscribe((status) => {
            console.log(`Participants subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to participant changes');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              console.warn(`Participants subscription status: ${status}, will attempt to reconnect`);
              // Will attempt to reconnect on component re-render
              subscriptionsActive = false;
            }
          });
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
        subscriptionsActive = false;
      }
    };

    setupRealtime();

    // Cleanup function with proper channel removal
    return () => {
      console.log('Cleaning up real-time subscriptions');
      if (roomSubscription) {
        supabase.removeChannel(roomSubscription);
      }
      if (participantsSubscription) {
        supabase.removeChannel(participantsSubscription);
      }
      subscriptionsActive = false;
    };
  }, [currentRoom, fetchRooms]);
  
  // Restore room from localStorage on initial load
  useEffect(() => {
    if (currentUser && !roomRestoredRef.current) {
      const savedRoom = localStorage.getItem('current-room');
      if (savedRoom) {
        try {
          const roomData = JSON.parse(savedRoom);
          // Verify the room is still valid and rejoin it
          if (roomData && roomData.id) {
            console.log('Attempting to restore saved room:', roomData.id);
            // Mark as restored to prevent loops
            roomRestoredRef.current = true;
            joinRoom(roomData.id).catch(err => {
              console.error('Failed to rejoin saved room:', err);
              localStorage.removeItem('current-room');
            });
          }
        } catch (error) {
          console.error('Error restoring saved room:', error);
          localStorage.removeItem('current-room');
        }
      }
    }
  }, [currentUser]);

  const joinRoom = async (roomId: string) => {
    if (joinCooldownRef.current) {
      console.log('Join cooldown active. Cannot join room:', roomId);
      return;
    }

    if (!currentUser || !profile) {
      toast.error('You need to be logged in to join a room');
      return;
    }

    // Early return if already in this room
    if (currentRoom && currentRoom.id === roomId) {
      console.log('Already in this room:', roomId);
      return;
    }

    // Early return if join is already in progress
    if (joinInProgress) {
      console.log('Join already in progress for room:', roomId);
      return;
    }

    console.log('Attempting to join room:', roomId);
    setIsLoading(true);
    setJoinInProgress(true);
    joinCooldownRef.current = true;
    lastJoinAttemptRef.current = Date.now();

    // Set a 1 second cooldown to prevent rapid join attempts
    setTimeout(() => {
      joinCooldownRef.current = false;
    }, 1000);

    try {
      // Increment join attempts
      const attempts = joinAttempts[roomId] || 0;
      setJoinAttempts({ ...joinAttempts, [roomId]: attempts + 1 });

      // Set a timeout for joining
      if (joiningTimeoutRef.current) {
        clearTimeout(joiningTimeoutRef.current);
      }

      joiningTimeoutRef.current = setTimeout(() => {
        if (joinInProgress) {
          setJoinInProgress(false);
          setIsLoading(false);
          joinCooldownRef.current = false;
          toast.error('Joining room timed out. Please try again.');
        }
      }, 10000); // 10 seconds timeout

      // Check if room exists
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        throw new Error(`Room not found: ${roomError.message}`);
      }

      // Check if already a participant
      const { data: existingParticipant, error: participantCheckError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .single();

      if (participantCheckError && participantCheckError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is expected if not joined yet
        console.warn('Error checking existing participation:', participantCheckError);
      }

      // If already a participant, just update status
      if (existingParticipant) {
        console.log('Already a participant in this room, updating status');
        
        // Update joined_at time
        const { error: updateError } = await supabase
          .from('room_participants')
          .update({ 
            joined_at: new Date().toISOString(),
          })
          .eq('room_id', roomId)
          .eq('user_id', currentUser.id);
          
        if (updateError) {
          console.warn('Error updating participant status:', updateError);
        }
      } else {
        // Join room in database with upsert to handle concurrent requests
        const { error: joinError } = await supabase
          .from('room_participants')
          .upsert({
            room_id: roomId,
            user_id: currentUser.id,
            joined_at: new Date().toISOString(),
            is_moderator: roomData.created_by === currentUser.id
          }, { 
            onConflict: 'room_id,user_id',
            ignoreDuplicates: true
          });

        if (joinError) {
          throw new Error(`Error joining room: ${joinError.message}`);
        }
      }

      // Connect to WebRTC voice chat room if not already connected
      let audioConnected = false;
      try {
        audioConnected = await joinAudioRoom(roomId);
        
        if (!audioConnected) {
          console.warn('Failed to connect to voice chat, but continuing with room join');
        } else {
          console.log('Successfully connected to voice chat');
        }
      } catch (audioError) {
        console.error('Error connecting to voice chat:', audioError);
        // Continue with room join despite audio error
      }

      // Fetch room data
      await fetchRooms();

      const roomWithParticipants = rooms.find(r => r.id === roomId);

      if (!roomWithParticipants) {
        throw new Error('Room not found after joining');
      }

      // Set as current room
      setCurrentRoom(roomWithParticipants);
      
      // Save to localStorage for reconnection
      localStorage.setItem('current-room', JSON.stringify(roomWithParticipants));

      // Only show success toast on initial join
      if (!existingParticipant) {
        toast.success(`Joined room: ${roomWithParticipants.name}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error(error instanceof Error ? `${error.message}` : 'Failed to join room');
    } finally {
      setIsLoading(false);
      setJoinInProgress(false);
      joinCooldownRef.current = false;
      if (joiningTimeoutRef.current) {
        clearTimeout(joiningTimeoutRef.current);
        joiningTimeoutRef.current = null;
      }
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !currentUser) {
      return;
    }

    const roomId = currentRoom.id;
    setIsLoading(true);

    try {
      // Leave the room in the database
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);

      if (error) {
        throw new Error(`Error leaving room: ${error.message}`);
      }

      // Disconnect from WebRTC voice chat
      await leaveAudioRoom();

      setCurrentRoom(null);
      localStorage.removeItem('current-room');
      toast.success('Left the room');
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave room');
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (roomData: Partial<RoomData>): Promise<string> => {
    if (!currentUser) {
      toast.error('You must be logged in to create a room');
      throw new Error('Not authenticated');
    }
    
    setIsLoading(true);
    try {
      // Validate required fields
      if (!roomData.name) {
        throw new Error('Room name is required');
      }
      
      // Ensure theme data is properly structured with all required fields
      const themeData = {
        topic: roomData.topic || 'General',
        description: roomData.description || '',
        color: roomData.color || 'from-purple-500 to-pink-500',
        coverImage: roomData.coverImage || '/placeholder.svg' // Make sure this matches the expected field name
      };
      // Prepare room data for insertion
      const roomInsertData: {
        name: string;
        created_by: string;
        is_active: boolean;
        theme: string; // Change to string - we'll stringify the JSON
        scheduled_for?: string;
      } = {
        name: roomData.name,
        created_by: currentUser.id,
        is_active: true,
        theme: JSON.stringify(themeData), // Stringify the theme object
      };
      
      // Add scheduled_for field if it's an upcoming room
      if (roomData.scheduled_for) {
        roomInsertData.scheduled_for = roomData.scheduled_for;
      }
      
      console.log('Creating room with data:', roomInsertData);
      console.log('Theme data:', themeData);
      
      // Create the room in the database
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert(roomInsertData)
        .select()
        .single();
      
      if (roomError) {
        console.error('Room creation database error:', roomError);
        throw new Error('Failed to create room: ' + roomError.message);
      }
      
      if (!newRoom || !newRoom.id) {
        throw new Error('Room creation failed: No room ID returned');
      }
      
      // Add user as participant (and moderator since they created the room)
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: newRoom.id,
          user_id: currentUser.id,
          is_moderator: true,
          is_speaking: !roomData.scheduled_for, // Only set as speaking if it's a live room
          joined_at: new Date().toISOString(),
        });
      
      if (participantError) {
        console.error('Failed to add creator as participant:', participantError);
        // Try to delete the room if we couldn't add the participant
        await supabase.from('rooms').delete().eq('id', newRoom.id);
        throw new Error('Failed to setup the room participants');
      }
      
      // Fetch the updated list of rooms
      await fetchRooms();
      
      toast.success(roomData.scheduled_for ? 'Room scheduled successfully!' : 'Room created successfully!');
      
      return newRoom.id;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Failed to create room');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeaking = async (speakerId: string) => {
    if (!currentRoom) {
      toast.error('You must be in a room to toggle speaking');
      return;
    }
    
    // Only allow the user to toggle their own speaking status
    // or moderators to toggle others
    const currentUserIsModerator = currentRoom.speakers.some(
      speaker => speaker.id === currentUser?.id && speaker.isModerator
    );
    
    const isCurrentUser = speakerId === currentUser?.id;
    
    if (!isCurrentUser && !currentUserIsModerator) {
      toast.error('You do not have permission to change speaker status');
      return;
    }
    
    try {
      // Find the current state of the speaker
      const speaker = currentRoom.speakers.find(s => s.id === speakerId);
      if (!speaker) return;
      
      const newSpeakingState = !speaker.isSpeaking;
      
      // Update the speaking status in the database
      const { error } = await supabase
        .from('room_participants')
        .update({ is_speaking: newSpeakingState })
        .eq('room_id', currentRoom.id)
        .eq('user_id', speakerId);
      
      if (error) throw error;
      
      // If this is the current user, update audio context
      if (isCurrentUser) {
        // Reference audio context functions - will be implemented in AudioContext
        const { toggleMute } = await import('@/context/AudioContext').then(mod => mod.useAudio());
        
        // Toggle mute/unmute based on speaking state
        if (newSpeakingState) {
          toast.success('You are now a speaker!');
          toggleMute(); // Unmute the microphone
        } else {
          toast.info('You are now a listener');
          toggleMute(); // Mute the microphone
        }
      }
      
      // Refresh room data to get updated speaker status
      await fetchRooms();
    } catch (error: any) {
      console.error('Error toggling speaking status:', error);
      toast.error(error.message || 'Failed to update speaker status');
    }
  };

  // Export the generateDummyRooms function for use in other components
  const generateDummyRooms = (): RoomData[] => {
    try {
      return [
        {
          id: 'dummy-1',
          name: 'Tech Talk: AI and Machine Learning',
          description: 'Discussing the latest trends in artificial intelligence and machine learning',
          participants: 24,
          topic: 'Technology',
          speakers: [
            {
              id: 'speaker-1',
              name: 'Sarah Johnson',
              username: 'sarahj',
              avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
              isModerator: true,
              isSpeaking: true
            },
            {
              id: 'speaker-2',
              name: 'Mike Chen',
              username: 'mikec',
              avatar: 'https://ui-avatars.com/api/?name=Mike+Chen&background=random',
              isModerator: false,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-blue-500 to-teal-400',
          isLive: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
        },
        {
          id: 'dummy-2',
          name: 'Music Production Tips & Tricks',
          description: 'Share your music production techniques and get feedback',
          participants: 18,
          topic: 'Music',
          speakers: [
            {
              id: 'speaker-3',
              name: 'DJ Harmony',
              username: 'djharmony',
              avatar: 'https://ui-avatars.com/api/?name=DJ+Harmony&background=random',
              isModerator: true,
              isSpeaking: true
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-purple-500 to-pink-500',
          isLive: true,
          created_by: 'system',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dummy-3',
          name: 'Book Club: Monthly Discussion',
          description: 'Discussing "The Silent Patient" - this month\'s book club pick',
          participants: 12,
          topic: 'Books',
          speakers: [
            {
              id: 'speaker-4',
              name: 'Emma Watson',
              username: 'emmaw',
              avatar: 'https://ui-avatars.com/api/?name=Emma+Watson&background=random',
              isModerator: true,
              isSpeaking: true
            },
            {
              id: 'speaker-5',
              name: 'Alex Rodriguez',
              username: 'alexr',
              avatar: 'https://ui-avatars.com/api/?name=Alex+Rodriguez&background=random',
              isModerator: false,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-yellow-400 to-orange-500',
          isLive: true,
          created_by: 'system',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dummy-4',
          name: 'Startup Founders Meetup',
          description: 'Networking event for startup founders and entrepreneurs',
          participants: 15,
          topic: 'Business',
          speakers: [
            {
              id: 'speaker-6',
              name: 'Jessica Parker',
              username: 'jessicap',
              avatar: 'https://ui-avatars.com/api/?name=Jessica+Parker&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-emerald-400 to-blue-500',
          isLive: true,
          created_by: 'system',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dummy-5',
          name: 'Digital Nomad Lifestyle',
          description: 'Tips for working remotely while traveling the world',
          participants: 8,
          topic: 'Travel',
          speakers: [
            {
              id: 'speaker-7',
              name: 'Nomad Nick',
              username: 'nomadn',
              avatar: 'https://ui-avatars.com/api/?name=Nomad+Nick&background=random',
              isModerator: true,
              isSpeaking: true
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-orange-400 to-red-500',
          isLive: true,
          created_by: 'system',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ];
    } catch (error) {
      console.error("Error generating dummy rooms:", error);
      // Return a minimal valid room if there's an error
      return [{
        id: 'fallback-room',
        name: 'Fallback Room',
        description: 'This is a fallback room',
        participants: 1,
        topic: 'General',
        speakers: [{
          id: 'fallback-speaker',
          name: 'System',
          username: 'system',
          avatar: '/placeholder.svg',
          isModerator: true,
          isSpeaking: false
        }],
        coverImage: '/placeholder.svg',
        color: 'from-blue-500 to-teal-400',
        isLive: true,
        created_by: 'system',
        created_at: new Date().toISOString()
      }];
    }
  };

  // Generate dummy upcoming rooms
  const generateDummyUpcomingRooms = (): RoomData[] => {
    try {
      // Create dates for upcoming events
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(18, 30, 0, 0);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(20, 0, 0, 0);
      
      const threeHoursLater = new Date();
      threeHoursLater.setHours(threeHoursLater.getHours() + 3);
      
      const twoHoursLater = new Date();
      twoHoursLater.setHours(twoHoursLater.getHours() + 2);
      
      return [
        {
          id: 'upcoming-1',
          name: 'Future of Web Development',
          description: 'Discussion about WebAssembly, Edge Computing, and more',
          participants: 5,
          topic: 'Technology',
          speakers: [
            {
              id: 'speaker-6',
              name: 'Chris Developer',
              username: 'chrisdev',
              avatar: 'https://ui-avatars.com/api/?name=Chris+Developer&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-indigo-500 to-purple-600',
          isLive: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          scheduled_for: tomorrow.toISOString()
        },
        {
          id: 'upcoming-2',
          name: 'Cryptocurrency Insights',
          description: 'Latest trends in crypto, NFTs, and blockchain technology',
          participants: 8,
          topic: 'Business',
          speakers: [
            {
              id: 'speaker-7',
              name: 'Crypto Kate',
              username: 'cryptokate',
              avatar: 'https://ui-avatars.com/api/?name=Crypto+Kate&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-green-400 to-emerald-500',
          isLive: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          scheduled_for: dayAfterTomorrow.toISOString()
        },
        {
          id: 'upcoming-3',
          name: 'Weekly Meditation Session',
          description: 'Guided meditation and mindfulness practices for stress relief',
          participants: 3,
          topic: 'Health',
          speakers: [
            {
              id: 'speaker-8',
              name: 'Mindful Maya',
              username: 'mindfulmaya',
              avatar: 'https://ui-avatars.com/api/?name=Mindful+Maya&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-blue-500 to-teal-400',
          isLive: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          scheduled_for: nextWeek.toISOString()
        },
        {
          id: 'upcoming-4',
          name: 'UI/UX Design Workshop',
          description: 'Learn practical design skills and get feedback on your projects',
          participants: 12,
          topic: 'Design',
          speakers: [
            {
              id: 'speaker-9',
              name: 'Designer Dan',
              username: 'designerdan',
              avatar: 'https://ui-avatars.com/api/?name=Designer+Dan&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-pink-400 to-pink-600',
          isLive: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          scheduled_for: twoHoursLater.toISOString()
        },
        {
          id: 'upcoming-5',
          name: 'Photography Tips & Tricks',
          description: 'Professional photographers share their secrets and answer questions',
          participants: 7,
          topic: 'Photography',
          speakers: [
            {
              id: 'speaker-10',
              name: 'Photo Phil',
              username: 'photophil',
              avatar: 'https://ui-avatars.com/api/?name=Photo+Phil&background=random',
              isModerator: true,
              isSpeaking: false
            }
          ],
          coverImage: '/placeholder.svg',
          color: 'from-yellow-400 to-orange-500',
          isLive: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          scheduled_for: threeHoursLater.toISOString()
        }
      ];
    } catch (error) {
      console.error("Error generating dummy upcoming rooms:", error);
      // Return a minimal valid upcoming room if there's an error
      return [{
        id: 'fallback-upcoming',
        name: 'Upcoming Session',
        description: 'This is a fallback upcoming room',
        participants: 1,
        topic: 'General',
        speakers: [{
          id: 'fallback-speaker',
          name: 'System',
          username: 'system',
          avatar: '/placeholder.svg',
          isModerator: true,
          isSpeaking: false
        }],
        coverImage: '/placeholder.svg',
        color: 'from-blue-500 to-teal-400',
        isLive: false,
        created_by: 'system',
        created_at: new Date().toISOString(),
        scheduled_for: new Date(Date.now() + 86400000).toISOString() // tomorrow
      }];
    }
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        upcomingRooms,
        currentRoom,
        fetchRooms,
        joinRoom,
        leaveRoom,
        createRoom,
        toggleSpeaking,
        isLoading
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
