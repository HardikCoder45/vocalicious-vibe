import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import RoomCard from '@/components/RoomCard';
import { Plus, Mic, Flame, Clock, Loader2, Calendar, Command, PlusCircle } from "lucide-react";
import { useRoom } from '@/context/RoomContext';
import { useUser } from '@/context/UserContext';
import { useVoiceCommand } from '@/context/VoiceCommandContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RoomData } from '@/context/RoomContext';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Avatar from '@/components/Avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Upcoming room type (for future implementation)
interface UpcomingRoom {
  id: string;
  name: string;
  description: string;
  topic: string;
  date: string;
  participants: number;
  creator: {
    name: string;
    avatar: string;
  };
}

const Index = () => {
  const { rooms, upcomingRooms, joinRoom, isLoading: roomsLoading, fetchRooms } = useRoom();
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('live');
  const { isVoiceCommandEnabled } = useVoiceCommand();
  const [showVoiceAlert, setShowVoiceAlert] = useState(false);

  useEffect(() => {
    // Check if this is the first time user sees the voice command feature
    const hasSeenVoiceAlert = localStorage.getItem('hasSeenVoiceAlert');
    if (!hasSeenVoiceAlert) {
      setShowVoiceAlert(true);
      // Mark as seen
      localStorage.setItem('hasSeenVoiceAlert', 'true');
    }
  }, []);

  useEffect(() => {
    // Load rooms data with fallback to demo content
    const loadRooms = async () => {
      try {
        await fetchRooms();
        
        // If we still have no rooms after fetching, manually trigger the dummy rooms
        if (rooms.length === 0) {
          console.log('No live rooms found, showing demo content');
        }
        
        if (upcomingRooms.length === 0) {
          console.log('No upcoming rooms found, showing demo content');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Could not load rooms. Using demo content instead.');
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
  }, [fetchRooms, rooms.length, upcomingRooms.length]);

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
        toast.error('Failed to join room. Please try again.');
      });
    } else {
      navigate('/auth', { state: { from: `/room/${roomId}` } });
    }
  };

  const handleScheduledRoom = (roomId: string) => {
    if (isAuthenticated) {
      // Navigate to the room details page where users can set a reminder
      // For now, just show a toast message
      toast.info('You will be able to join this room when it goes live');
    } else {
      navigate('/auth', { state: { from: `/` } });
    }
  };

  // Filter and sort live rooms by recency
  const liveRooms = rooms.sort((a, b) => {
    // Show most recent rooms first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Sort upcoming rooms by scheduled date
  const sortedUpcomingRooms = upcomingRooms.sort((a, b) => {
    if (!a.scheduled_for || !b.scheduled_for) return 0;
    return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
  });
  
  const isPageLoading = isLoading || roomsLoading || userLoading;

  return (
    <div className="min-h-screen w-full pb-16 md:pb-0">
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
        {showVoiceAlert && (
          <Alert className="mb-6 animate-fade-in">
            <Command className="h-4 w-4" />
            <AlertTitle>Voice commands now available!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Control the app with voice commands. Try saying "join room" or "create room".</span>
              <Button variant="outline" size="sm" onClick={() => setShowVoiceAlert(false)}>Got it</Button>
            </AlertDescription>
          </Alert>
        )}

        {isVoiceCommandEnabled && (
          <div className="mb-4 p-2 border border-primary/20 rounded-lg bg-primary/5 text-xs flex items-center gap-2 text-muted-foreground animate-pulse-slow">
            <Command className="h-3 w-3 text-primary" />
            <span>Voice commands active - Try saying "join room" or "create room"</span>
          </div>
        )}
        
        <Tabs 
          defaultValue="live" 
          className="w-full animate-fade-in"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="live" className="gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Live Now ({!isPageLoading ? liveRooms.length : '...'})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({!isPageLoading ? sortedUpcomingRooms.length : '...'})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="animate-fade-in space-y-6">
            {isPageLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
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
                <p className="mb-4">Be the first to start a conversation</p>
                <Button 
                  onClick={handleCreateRoom} 
                  className="mt-4 animate-bounce-subtle"
                  size="lg"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Room
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="animate-fade-in space-y-6">
            {isPageLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {!isPageLoading && sortedUpcomingRooms.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <Calendar className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No upcoming rooms</h3>
                <p className="mb-4">Schedule a conversation for later</p>
                <div className="mt-4">
                  <Button 
                    onClick={handleCreateRoom} 
                    variant="outline"
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Schedule Room
                  </Button>
                </div>
              </div>
            )}
            
            {!isPageLoading && sortedUpcomingRooms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedUpcomingRooms.map((room, index) => (
                  <div 
                    key={room.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card 
                      className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleScheduledRoom(room.id)}
                    >
                      <div className={`h-6 bg-gradient-to-r ${room.color}`}></div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3 mt-2">
                          <div>
                            <h3 className="font-semibold text-base">{room.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{room.topic}</Badge>
                            </div>
                          </div>
                          <Badge variant="secondary" className="uppercase text-xs font-medium">
                            Scheduled
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {room.description}
                        </p>
                        
                        {room.scheduled_for && (
                          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(room.scheduled_for), 'PPP')} at {format(parseISO(room.scheduled_for), 'p')}
                            </span>
                          </div>
                        )}
                        
                        {room.speakers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Avatar 
                              src={room.speakers[0].avatar} 
                              alt={room.speakers[0].name} 
                              size="sm"
                              userId={room.speakers[0].id} 
                            />
                            <div className="text-sm font-medium">
                              {room.speakers[0].name} (Host)
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
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
