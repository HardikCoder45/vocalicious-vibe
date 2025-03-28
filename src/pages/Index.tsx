
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import RoomCard from '@/components/RoomCard';
import { Plus, Mic, Flame, Clock } from "lucide-react";
import { useRoom } from '@/context/RoomContext';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Index = () => {
  const { rooms, joinRoom, isLoading: roomsLoading, fetchRooms } = useRoom();
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load rooms data
    const loadRooms = async () => {
      try {
        await fetchRooms();
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Could not load rooms. Please try again.');
      } finally {
        // Short delay to prevent flashing
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    
    loadRooms();
    
    // Refresh rooms every 30 seconds
    const interval = setInterval(() => {
      fetchRooms().catch(error => {
        console.error('Error refreshing rooms:', error);
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreateRoom = () => {
    if (isAuthenticated) {
      navigate('/create-room');
    } else {
      navigate('/auth', { state: { from: '/create-room' } });
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (isAuthenticated) {
      joinRoom(roomId).then(() => {
        navigate(`/room/${roomId}`);
      }).catch(error => {
        console.error('Error joining room:', error);
      });
    } else {
      navigate('/auth', { state: { from: `/room/${roomId}` } });
    }
  };

  const liveRooms = rooms.filter(room => room.isLive);
  const upcomingRooms = []; // For future implementation
  
  const isPageLoading = isLoading || roomsLoading || userLoading;

  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 py-6 flex flex-col gap-2 md:px-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-purple">Vibe</h1>
          <Button 
            onClick={handleCreateRoom}
            className="flex items-center gap-2 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Room
          </Button>
        </div>
        <p className="text-muted-foreground">Join a voice room or start your own conversation</p>
      </header>
      
      <main className="px-4 md:px-8 pb-8 relative">
        <Tabs defaultValue="live" className="w-full animate-fade-in">
          <TabsList className="mb-6">
            <TabsTrigger value="live" className="gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="animate-fade-in space-y-6">
            {!isPageLoading && liveRooms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveRooms.map((room, index) => (
                  <div 
                    key={room.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RoomCard 
                      room={room} 
                      onClick={() => handleJoinRoom(room.id)} 
                    />
                  </div>
                ))}
              </div>
            )}
            
            {!isPageLoading && liveRooms.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground animate-fade-in">
                <Mic className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No live rooms</h3>
                <p>Be the first to start a conversation</p>
                <Button onClick={handleCreateRoom} className="mt-4">Create Room</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="animate-fade-in space-y-6">
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">No upcoming rooms</h3>
              <p className="mb-4">Schedule a conversation for later</p>
              <Button onClick={handleCreateRoom} className="mt-4">Schedule Room</Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {isPageLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="room-card animate-pulse h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
