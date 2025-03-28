
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";

// Types
export interface Speaker {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isModerator: boolean;
  isSpeaking: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  participants: number;
  topic: string;
  speakers: Speaker[];
  coverImage: string;
  color: string;
  isLive: boolean;
  created_by: string;
  created_at: string;
}

interface RoomContextType {
  rooms: RoomData[];
  currentRoom: RoomData | null;
  fetchRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  createRoom: (roomData: Partial<RoomData>) => Promise<void>;
  toggleSpeaking: (speakerId: string) => Promise<void>;
  isLoading: boolean;
}

// Create context
const RoomContext = createContext<RoomContextType>({
  rooms: [],
  currentRoom: null,
  fetchRooms: async () => {},
  joinRoom: async () => {},
  leaveRoom: async () => {},
  createRoom: async () => {},
  toggleSpeaking: async () => {},
  isLoading: false,
});

export const useRoom = () => useContext(RoomContext);

export const RoomProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, profile } = useUser();

  // Setup real-time room subscriptions
  useEffect(() => {
    const setupRealtime = async () => {
      // Initial fetch
      try {
        await fetchRooms();
      } catch (error) {
        console.error("Initial room fetch failed:", error);
      }

      // Subscribe to changes
      const roomSubscription = supabase
        .channel('public:rooms')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'rooms' 
        }, () => {
          fetchRooms().catch(err => {
            console.error("Failed to fetch rooms after change:", err);
          });
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.error("Failed to subscribe to room changes:", status);
          }
        });

      return () => {
        supabase.removeChannel(roomSubscription);
      };
    };

    setupRealtime();
  }, []);

  // Fetch room data from Supabase
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      // For each room, fetch the participants
      const roomsWithDetails = await Promise.all(
        roomsData.map(async (room) => {
          try {
            // Get participants
            const { data: participants, error: participantsError } = await supabase
              .from('room_participants')
              .select('*, user_id')
              .eq('room_id', room.id);

            if (participantsError) {
              console.error('Error fetching participants:', participantsError);
              return null;
            }

            // Fetch user profiles for each participant
            const speakersPromises = participants.map(async (participant) => {
              try {
                const { data: userProfile, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('id', participant.user_id)
                  .single();

                if (profileError) {
                  console.error('Error fetching user profile:', profileError);
                  return null;
                }

                return {
                  id: userProfile.id,
                  name: userProfile.username, // Using username as name since name doesn't exist
                  username: userProfile.username,
                  avatar: userProfile.avatar_url || '/placeholder.svg',
                  isModerator: participant.is_moderator,
                  isSpeaking: participant.is_speaking,
                };
              } catch (error) {
                console.error('Error processing participant:', error);
                return null;
              }
            });

            const speakersData = await Promise.all(speakersPromises);
            const speakers = speakersData.filter((speaker): speaker is Speaker => speaker !== null);

            // Generate a gradient color based on the room name
            const colors = [
              'from-purple-500 to-pink-500',
              'from-blue-500 to-teal-400',
              'from-yellow-400 to-orange-500',
              'from-green-400 to-emerald-500',
              'from-indigo-500 to-purple-600',
              'from-red-500 to-pink-600',
            ];
            
            const colorIndex = room.id.charCodeAt(0) % colors.length;

            return {
              id: room.id,
              name: room.name,
              description: room.description || 'Join the conversation', // Default if missing
              participants: participants.length,
              topic: room.topic || 'General', // Default if missing
              speakers,
              coverImage: '/placeholder.svg',
              color: colors[colorIndex],
              isLive: true,
              created_by: room.created_by,
              created_at: room.created_at,
            };
          } catch (error) {
            console.error('Error processing room:', error);
            return null;
          }
        })
      );

      const validRooms = roomsWithDetails.filter((room): room is RoomData => room !== null);
      setRooms(validRooms);

      // If we're in a room, update the current room data
      if (currentRoom) {
        const updatedRoom = validRooms.find(r => r.id === currentRoom.id);
        if (updatedRoom) {
          setCurrentRoom(updatedRoom);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = useCallback(async (roomId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to join a room');
      return;
    }

    setIsLoading(true);
    try {
      // Find the room in our existing data
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        // If room not found in cache, try to fetch it directly
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (roomError) throw new Error('Room not found');
        
        // Fetch this room's details and set as current
        await fetchRooms();
        const updatedRoom = rooms.find(r => r.id === roomId);
        if (!updatedRoom) throw new Error('Room not found after refresh');
        
        // Check if user is already a participant
        const { data: existingParticipant, error: checkError } = await supabase
          .from('room_participants')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (checkError) throw checkError;

        // If not already a participant, add them
        if (!existingParticipant) {
          const { error: joinError } = await supabase
            .from('room_participants')
            .insert({
              room_id: roomId,
              user_id: currentUser.id,
              is_moderator: false,
              is_speaking: false
            });

          if (joinError) throw joinError;
        }

        setCurrentRoom(updatedRoom);
        toast(`Joined ${updatedRoom.name}`);
        return;
      }

      // Check if user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (checkError) throw checkError;

      // If not already a participant, add them
      if (!existingParticipant) {
        const { error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: currentUser.id,
            is_moderator: false,
            is_speaking: false
          });

        if (joinError) throw joinError;
      }

      // Set this as the current room
      setCurrentRoom(room);
      toast(`Joined ${room.name}`);

      // Refresh rooms data to get latest participants
      fetchRooms();
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast.error(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, [rooms, currentUser]);

  const leaveRoom = useCallback(async () => {
    if (!currentUser || !currentRoom) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast(`Left ${currentRoom.name}`);
      setCurrentRoom(null);
      
      // Refresh rooms data
      fetchRooms();
    } catch (error: any) {
      console.error('Error leaving room:', error);
      toast.error(error.message || 'Failed to leave room');
    }
  }, [currentRoom, currentUser]);

  const createRoom = useCallback(async (roomData: Partial<RoomData>) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a room');
      return;
    }

    setIsLoading(true);
    try {
      // Insert the new room
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomData.name || 'New Room',
          description: roomData.description || 'Join the conversation',
          topic: roomData.topic || 'General',
          created_by: currentUser.id,
          is_active: true
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add the creator as a moderator
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: newRoom.id,
          user_id: currentUser.id,
          is_moderator: true,
          is_speaking: false
        });

      if (participantError) throw participantError;

      toast(`Created room: ${newRoom.name}`);
      
      // Refresh rooms and join the new room
      await fetchRooms();
      await joinRoom(newRoom.id);
      
      // Intentionally not returning the room ID to match the void return type
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, fetchRooms, joinRoom]);

  const toggleSpeaking = useCallback(async (speakerId: string) => {
    if (!currentUser || !currentRoom) return;

    try {
      // Get the participant to toggle
      const { data: participant, error: fetchError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', currentRoom.id)
        .eq('user_id', speakerId)
        .single();

      if (fetchError) throw fetchError;

      // Update the speaking status
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ is_speaking: !participant.is_speaking })
        .eq('room_id', currentRoom.id)
        .eq('user_id', speakerId);

      if (updateError) throw updateError;

      // Refresh room data
      fetchRooms();
    } catch (error: any) {
      console.error('Error updating speaking status:', error);
      toast.error(error.message || 'Failed to update speaking status');
    }
  }, [currentRoom, currentUser, fetchRooms]);

  return (
    <RoomContext.Provider value={{
      rooms,
      currentRoom,
      fetchRooms,
      joinRoom,
      leaveRoom,
      createRoom,
      toggleSpeaking,
      isLoading,
    }}>
      {children}
    </RoomContext.Provider>
  );
};
