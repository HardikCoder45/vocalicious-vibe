import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Clock, Sparkles, Loader2 } from "lucide-react";
import { RoomData, useRoom } from '@/context/RoomContext';
import RoomCard from '@/components/RoomCard';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParticleBackground from '@/components/ParticleBackground';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { checkConnection } from '@/integrations/supabase/client.tsx';

const ExplorePage = () => {
  const { rooms, upcomingRooms, joinRoom, fetchRooms } = useRoom();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("foryou");
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  useEffect(() => {
    // Fetch rooms on component mount with error handling
    const loadRooms = async () => {
      try {
        // Check connection status first
        const isConnected = await checkConnection();
        if (!isConnected) {
          toast.error('Connection issues detected', {
            description: 'Some rooms might not be available. Please check your connection.',
            duration: 5000
          });
        }
        
        await fetchRooms();
        console.log('Rooms fetched successfully in explore page:', rooms.length, 'rooms available');
      } catch (error) {
        console.error('Error fetching rooms in explore page:', error);
        toast.error('Could not load all rooms', {
          description: 'Showing available data. Try refreshing the page.',
          action: {
            label: 'Retry',
            onClick: () => loadRooms()
          }
        });
      } finally {
        // Short delay for better UX
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    
    loadRooms();
  }, [fetchRooms]);
  
  useEffect(() => {
    if (!rooms) {
      console.error('No rooms data available');
      setFilteredRooms([]);
      return;
    }
    
    console.log('Setting filtered rooms from', rooms.length, 'available rooms');
    
    // Filter rooms based on search term
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms);
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = rooms.filter(room => 
      (room.name || '').toLowerCase().includes(lowerCaseSearch) || 
      (room.description || '').toLowerCase().includes(lowerCaseSearch) ||
      (room.topic || '').toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);
  
  const handleJoinRoom = async (roomId: string) => {
    try {
      setIsLoading(true);
      await joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setIsLoading(false);
    }
  };
  
  // Group rooms by category for the "For You" tab
  const categorizedRooms = {
    trending: filteredRooms
      .filter(room => room.isLive)
      .sort((a, b) => (b.participants || 0) - (a.participants || 0))
      .slice(0, 3),
    
    tech: filteredRooms.filter(room => 
      ((room.topic || '').toLowerCase() === 'technology' || 
      (room.topic || '').toLowerCase() === 'science')
    ),
    
    creative: filteredRooms.filter(room => 
      ['art', 'music', 'design', 'books'].includes((room.topic || '').toLowerCase())
    ),
    
    business: filteredRooms.filter(room => 
      ['business', 'finance', 'startups'].includes((room.topic || '').toLowerCase())
    ),
  };
  
  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center py-12">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-primary" />
      </motion.div>
    </div>
  );
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 py-6 md:px-8 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <motion.h1 
          className="text-3xl font-bold gradient-purple mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          Explore
        </motion.h1>
        
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', damping: 12 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for rooms, topics, or people"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 bg-card/80 backdrop-blur-sm border border-accent/20 shadow-sm transition-all focus-visible:ring-accent"
          />
        </motion.div>
      </header>
      
      <main className="px-4 md:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={containerVariants}
              >
                <TabsContent value="foryou" className="space-y-8">
                  {/* Trending section */}
                  {categorizedRooms.trending.length > 0 && (
                    <section>
                      <motion.h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        variants={itemVariants}
                      >
                        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                        Trending Now
                      </motion.h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedRooms.trending.map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* Tech section */}
                  {categorizedRooms.tech.length > 0 && (
                    <section>
                      <motion.h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        variants={itemVariants}
                      >
                        <span className="mr-2">🖥️</span>
                        Tech & Science
                      </motion.h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedRooms.tech.slice(0, 3).map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index + 1}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* Creative section */}
                  {categorizedRooms.creative.length > 0 && (
                    <section>
                      <motion.h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        variants={itemVariants}
                      >
                        <span className="mr-2">🎨</span>
                        Creative Arts
                      </motion.h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedRooms.creative.slice(0, 3).map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index + 1}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Business section */}
                  {categorizedRooms.business.length > 0 && (
                    <section>
                      <motion.h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        variants={itemVariants}
                      >
                        <span className="mr-2">💼</span>
                        Business & Finance
                      </motion.h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedRooms.business.slice(0, 3).map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index + 1}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* All Rooms section when no categories match */}
                  {Object.values(categorizedRooms).every(arr => arr.length === 0) && filteredRooms.length > 0 && (
                    <section>
                      <motion.h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        variants={itemVariants}
                      >
                        <span className="mr-2">🔍</span>
                        All Available Rooms
                      </motion.h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.slice(0, 6).map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index + 1}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  
                  {/* Show empty state if no matching rooms */}
                  {filteredRooms.length === 0 && (
                    <motion.div 
                      className="flex flex-col items-center py-16 text-center text-muted-foreground"
                      variants={itemVariants}
                    >
                      <Search className="h-16 w-16 mb-4 opacity-20" />
                      <h3 className="text-xl font-medium mb-2">No matching rooms</h3>
                      <p>Try a different search term or create your own room</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4"
                      >
                        <Button onClick={() => navigate('/create-room')}>Create Room</Button>
                      </motion.div>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="trending" className="min-h-[300px]">
                  {filteredRooms.filter(room => room.isLive).length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      variants={containerVariants}
                    >
                      {filteredRooms
                        .filter(room => room.isLive)
                        .sort((a, b) => (b.participants || 0) - (a.participants || 0))
                        .map((room, index) => (
                          <motion.div 
                            key={room.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            custom={index}
                          >
                            <RoomCard 
                              room={room} 
                              onClick={() => handleJoinRoom(room.id)} 
                            />
                          </motion.div>
                        ))
                      }
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex flex-col items-center py-16 text-center text-muted-foreground"
                      variants={itemVariants}
                    >
                      <TrendingUp className="h-16 w-16 mb-4 opacity-20" />
                      <h3 className="text-xl font-medium mb-2">No trending rooms</h3>
                      <p>Be the first to start a popular conversation</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4"
                      >
                        <Button onClick={() => navigate('/create-room')}>Create Room</Button>
                      </motion.div>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="upcoming" className="min-h-[300px]">
                  {upcomingRooms.length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      variants={containerVariants}
                    >
                      {upcomingRooms.map((room, index) => (
                        <motion.div 
                          key={room.id} 
                          variants={itemVariants}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          custom={index}
                        >
                          <RoomCard 
                            room={room} 
                            onClick={() => {
                              toast.info(`${room.name} is scheduled for ${new Date(room.scheduled_for || '').toLocaleString()}`);
                            }} 
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex flex-col items-center py-16 text-center text-muted-foreground"
                      variants={itemVariants}
                    >
                      <Clock className="h-16 w-16 mb-4 opacity-20" />
                      <h3 className="text-xl font-medium mb-2">No upcoming rooms</h3>
                      <p>Schedule a room for later to see it here</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4"
                      >
                        <Button onClick={() => navigate('/create-room')}>Schedule a Room</Button>
                      </motion.div>
                    </motion.div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default ExplorePage;
