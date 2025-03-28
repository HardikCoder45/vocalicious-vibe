
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Clock, Sparkles } from "lucide-react";
import { RoomData, useRoom } from '@/context/RoomContext';
import RoomCard from '@/components/RoomCard';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParticleBackground from '@/components/ParticleBackground';

const ExplorePage = () => {
  const { rooms, joinRoom } = useRoom();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms);
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = rooms.filter(room => 
      room.name.toLowerCase().includes(lowerCaseSearch) || 
      room.description.toLowerCase().includes(lowerCaseSearch) ||
      room.topic.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);
  
  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
    navigate(`/room/${roomId}`);
  };
  
  // Group rooms by category for the "For You" tab
  const categorizedRooms = {
    trending: filteredRooms
      .filter(room => room.isLive)
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 3),
    
    tech: filteredRooms.filter(room => 
      room.topic.toLowerCase() === 'technology' || 
      room.topic.toLowerCase() === 'science'
    ),
    
    creative: filteredRooms.filter(room => 
      ['art', 'music', 'design', 'books'].includes(room.topic.toLowerCase())
    ),
  };
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 py-6 md:px-8 animate-fade-in">
        <h1 className="text-3xl font-bold gradient-purple mb-6">Explore</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for rooms, topics, or people"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </header>
      
      <main className="px-4 md:px-8 pb-8">
        <Tabs defaultValue="foryou" className="w-full animate-fade-in">
          <TabsList className="mb-6">
            <TabsTrigger value="foryou" className="gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              For You
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="foryou" className="animate-fade-in space-y-8">
            {/* Trending section */}
            {categorizedRooms.trending.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Trending Now
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedRooms.trending.map((room, index) => (
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
              </section>
            )}
            
            {/* Tech section */}
            {categorizedRooms.tech.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">🖥️</span>
                  Tech & Science
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedRooms.tech.slice(0, 3).map((room, index) => (
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
              </section>
            )}
            
            {/* Creative section */}
            {categorizedRooms.creative.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">🎨</span>
                  Creative Arts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedRooms.creative.slice(0, 3).map((room, index) => (
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
              </section>
            )}
            
            {/* Show empty state if no matching rooms */}
            {Object.values(categorizedRooms).every(arr => arr.length === 0) && !isLoading && (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground animate-fade-in">
                <Search className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No matching rooms</h3>
                <p>Try a different search term or create your own room</p>
                <Button onClick={() => navigate('/create-room')} className="mt-4">Create Room</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trending" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms
                .filter(room => room.isLive)
                .sort((a, b) => b.participants - a.participants)
                .map((room, index) => (
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
                ))
              }
            </div>
            
            {filteredRooms.filter(room => room.isLive).length === 0 && !isLoading && (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground animate-fade-in">
                <TrendingUp className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No trending rooms</h3>
                <p>Be the first to start a popular conversation</p>
                <Button onClick={() => navigate('/create-room')} className="mt-4">Create Room</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms
                .filter(room => !room.isLive)
                .map((room, index) => (
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
                ))
              }
            </div>
            
            {filteredRooms.filter(room => !room.isLive).length === 0 && !isLoading && (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground animate-fade-in">
                <Clock className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No upcoming rooms</h3>
                <p>Schedule a conversation for later</p>
                <Button onClick={() => navigate('/create-room')} className="mt-4">Schedule Room</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="room-card animate-pulse h-64 bg-muted"></div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExplorePage;
