
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";

// Types
export interface Speaker {
  id: string;
  name: string;
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
}

interface RoomContextType {
  rooms: RoomData[];
  currentRoom: RoomData | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  createRoom: (roomData: Partial<RoomData>) => void;
  toggleSpeaking: (speakerId: string) => void;
}

// Mock data
const mockSpeakers: Speaker[] = [
  {
    id: 'speaker-1',
    name: 'Alex Johnson',
    avatar: '/placeholder.svg',
    isModerator: true,
    isSpeaking: false,
  },
  {
    id: 'speaker-2',
    name: 'Sofia Chen',
    avatar: '/placeholder.svg',
    isModerator: false,
    isSpeaking: false,
  },
  {
    id: 'speaker-3',
    name: 'Marcus Lee',
    avatar: '/placeholder.svg',
    isModerator: false,
    isSpeaking: false,
  },
  {
    id: 'speaker-4',
    name: 'Emma Wilson',
    avatar: '/placeholder.svg',
    isModerator: false,
    isSpeaking: false,
  },
];

const mockRooms: RoomData[] = [
  {
    id: 'room-1',
    name: 'Tech Talk: AI Revolution',
    description: 'Join us as we discuss the latest in AI technology and its impact on society.',
    participants: 423,
    topic: 'Technology',
    speakers: mockSpeakers.slice(0, 3),
    coverImage: '/placeholder.svg',
    color: 'from-purple-500 to-pink-500',
    isLive: true,
  },
  {
    id: 'room-2',
    name: 'Music Production Tips',
    description: 'Professional producers share their secrets for creating chart-topping hits.',
    participants: 187,
    topic: 'Music',
    speakers: mockSpeakers.slice(1, 4),
    coverImage: '/placeholder.svg',
    color: 'from-blue-500 to-teal-400',
    isLive: true,
  },
  {
    id: 'room-3',
    name: 'Startup Founders Hangout',
    description: 'Networking and sharing experiences in the startup ecosystem.',
    participants: 256,
    topic: 'Business',
    speakers: [mockSpeakers[0], mockSpeakers[3]],
    coverImage: '/placeholder.svg',
    color: 'from-yellow-400 to-orange-500',
    isLive: true,
  },
  {
    id: 'room-4',
    name: 'Mindfulness Meditation',
    description: 'Guided meditation session for beginners and advanced practitioners.',
    participants: 98,
    topic: 'Wellness',
    speakers: [mockSpeakers[2]],
    coverImage: '/placeholder.svg',
    color: 'from-green-400 to-emerald-500',
    isLive: true,
  },
  {
    id: 'room-5',
    name: 'Book Club: Sci-Fi Classics',
    description: 'Discussing our favorite science fiction novels and their impact on the genre.',
    participants: 132,
    topic: 'Books',
    speakers: mockSpeakers.slice(0, 2),
    coverImage: '/placeholder.svg',
    color: 'from-indigo-500 to-purple-600',
    isLive: false,
  },
  {
    id: 'room-6',
    name: 'Travel Stories: Asia Edition',
    description: 'Sharing experiences and tips from travels across Asia.',
    participants: 75,
    topic: 'Travel',
    speakers: [mockSpeakers[1], mockSpeakers[3]],
    coverImage: '/placeholder.svg',
    color: 'from-red-500 to-pink-600',
    isLive: false,
  },
];

// Create context
const RoomContext = createContext<RoomContextType>({
  rooms: [],
  currentRoom: null,
  joinRoom: () => {},
  leaveRoom: () => {},
  createRoom: () => {},
  toggleSpeaking: () => {},
});

export const useRoom = () => useContext(RoomContext);

export const RoomProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomData[]>(mockRooms);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);

  // Initialize rooms with mock data
  useEffect(() => {
    // Simulate room data fetching
    setTimeout(() => {
      setRooms(mockRooms);
    }, 500);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setCurrentRoom(room);
      toast(`Joined ${room.name}`);
    }
  }, [rooms]);

  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      toast(`Left ${currentRoom.name}`);
      setCurrentRoom(null);
    }
  }, [currentRoom]);

  const createRoom = useCallback((roomData: Partial<RoomData>) => {
    const newRoom: RoomData = {
      id: `room-${Date.now()}`,
      name: roomData.name || 'New Room',
      description: roomData.description || 'No description provided',
      participants: 1,
      topic: roomData.topic || 'General',
      speakers: roomData.speakers || [mockSpeakers[0]],
      coverImage: roomData.coverImage || '/placeholder.svg',
      color: roomData.color || 'from-purple-500 to-pink-500',
      isLive: true,
    };

    setRooms(prev => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    toast(`Created room: ${newRoom.name}`);
  }, []);

  const toggleSpeaking = useCallback((speakerId: string) => {
    if (!currentRoom) return;

    setCurrentRoom(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        speakers: prev.speakers.map(speaker => 
          speaker.id === speakerId 
            ? { ...speaker, isSpeaking: !speaker.isSpeaking } 
            : speaker
        )
      };
    });
  }, [currentRoom]);

  return (
    <RoomContext.Provider value={{
      rooms,
      currentRoom,
      joinRoom,
      leaveRoom,
      createRoom,
      toggleSpeaking,
    }}>
      {children}
    </RoomContext.Provider>
  );
};
