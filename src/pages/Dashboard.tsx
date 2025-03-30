import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Activity, Users, Mic, TrendingUp, Clock, Calendar, 
  Sparkles, Loader2, Plus, RefreshCw, Search, Maximize, 
  MessageCircle, Music, Radio, Zap, Headphones, VolumeX,
  Volume2, Heart, BellRing, Target, Crown,ArrowRight,BookOpen, Home, Flame, Command
} from "lucide-react";
import { useUser } from '@/context/UserContext';
import { useRoom } from '@/context/RoomContext';
import ParticleBackground from '@/components/ParticleBackground';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import RoomCard from '@/components/RoomCard';
import { toast } from "sonner";
import PlatformLogo from '@/components/PlatformLogo';
import { Input } from '@/components/ui/input';
import { checkConnection } from '@/integrations/supabase/client.tsx';
import { useTheme } from '@/context/ThemeContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useVoiceCommand } from "@/context/VoiceCommandContext";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { PlusCircle } from "lucide-react";
import Avatar from '@/components/Avatar';
import { prefetchAvatars } from '@/utils/avatarUtils';

// Enhanced Room Card with animations
const EnhancedRoomCard = ({ room, onClick }) => {
  const controls = useAnimation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  
  // Random activity level for visualization
  const activityLevel = Math.floor(Math.random() * 100);
  
  // Random number of speakers between 1 and room.speakers.length
  const activeSpeakers = Math.max(1, Math.floor(Math.random() * (room.speakers.length || 3)));
  
  const getActivityColor = (level) => {
    if (level > 75) return 'text-emerald-500';
    if (level > 50) return 'text-amber-500';
    return 'text-indigo-500';
  };
  
  // Categories (for demo purposes)
  const categories = ['Music', 'Podcast', 'Learning', 'Discussion', 'Technology'];
  const roomCategory = room.category || categories[Math.floor(Math.random() * categories.length)];
  
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Music': return <Music className="h-4 w-4" />;
      case 'Podcast': return <Radio className="h-4 w-4" />;
      case 'Learning': return <BookOpen className="h-4 w-4" />;
      case 'Discussion': return <MessageCircle className="h-4 w-4" />;
      case 'Technology': return <Zap className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };
  
  return (
    <motion.div
      className={`group overflow-hidden rounded-xl border border-border/50 backdrop-blur-sm 
        ${isDark ? 'bg-card/70 hover:bg-card/90' : 'bg-card/80 hover:bg-card/95'}
        transition-all duration-300 shadow-md hover:shadow-xl`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={controls}
      whileHover={{
        y: -8,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseEnter={() => controls.start({ scale: 1, opacity: 1 })}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full bg-primary/10 text-primary`}>
              {getCategoryIcon(roomCategory)}
            </div>
            <Badge variant="outline" className="font-medium text-xs">
              {roomCategory}
            </Badge>
          </div>
          
          {room.isLive && (
            <motion.div 
              className="flex items-center gap-1.5 text-primary"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-medium">LIVE</span>
            </motion.div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{room.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{room.description || "Join this room for an exciting conversation!"}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Speakers avatars */}
          <div className="flex -space-x-3">
            {(room.speakers || Array(3).fill({})).slice(0, 3).map((speaker, i) => (
              <Avatar 
                key={i}
                src={speaker?.avatarUrl}
                alt={speaker?.username || "User"}
                className="border-2 border-background"
                size="sm"
                userId={speaker?.id}
              />
            ))}
            
            {(room.speakers?.length || 0) > 3 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{room.speakers.length - 3}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Activity level visualization */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Activity</span>
              <span className={getActivityColor(activityLevel)}>{activityLevel}%</span>
            </div>
            <Progress value={activityLevel} className="h-1" />
          </div>
          
          {/* Speakers visualization */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{room.participants || Math.floor(Math.random() * 80) + 5} listening</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{activeSpeakers} speaking</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sound wave animation at the bottom */}
      <div className="h-8 flex items-end justify-center gap-[1px] bg-gradient-to-t from-primary/5 to-transparent p-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[2px] bg-primary/40 rounded-t-full"
            initial={{ height: 2 }}
            animate={{ 
              height: isHovered || room.isLive
                ? [
                    2,
                    Math.abs(Math.sin(i * 0.2)) * 15 + Math.random() * 10 + 2,
                    Math.abs(Math.sin(i * 0.2)) * 8 + Math.random() * 6 + 2,
                    2
                  ] 
                : 2
            }}
            transition={{ 
              duration: 1.2,
              repeat: (isHovered || room.isLive) ? Infinity : 0,
              delay: i * 0.03 % 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Join button overlay (appears on hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button size="lg" className="rounded-full px-8">
                Join Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Interactive floating bubble component
const FloatingBubble = ({ size, delay, duration, color, children, x, y }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`absolute rounded-full flex items-center justify-center 
        text-primary-foreground backdrop-blur-md border border-white/10
        ${isDark ? 'bg-primary/30' : 'bg-primary/20'}`}
      style={{ 
        width: size, 
        height: size, 
        top: y + '%', 
        left: x + '%',
        boxShadow: isDark 
          ? '0 0 20px rgba(var(--primary), 0.2)' 
          : '0 0 25px rgba(var(--primary), 0.15)'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: [0, 15, -10, 5, 0],
        y: [0, -10, 10, -5, 0] 
      }}
      transition={{ 
        delay, 
        scale: { duration: 0.5 },
        opacity: { duration: 0.5 },
        x: { duration, repeat: Infinity, repeatType: "reverse" },
        y: { duration: duration * 1.3, repeat: Infinity, repeatType: "reverse" }
      }}
    >
      {children}
    </motion.div>
  );
};

// Interactive bubble background
const BubblesBackground = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bubbles = [
    { size: 80, delay: 0.5, duration: 12, x: 15, y: 20, icon: <Mic size={24} /> },
    { size: 60, delay: 0.7, duration: 15, x: 80, y: 30, icon: <Music size={18} /> },
    { size: 100, delay: 0.2, duration: 18, x: 35, y: 75, icon: <Headphones size={30} /> },
    { size: 70, delay: 0.9, duration: 14, x: 70, y: 85, icon: <MessageCircle size={22} /> },
    { size: 50, delay: 1.2, duration: 16, x: 90, y: 60, icon: <Volume2 size={16} /> },
    { size: 90, delay: 0.3, duration: 20, x: 10, y: 60, icon: <Radio size={28} /> },
  ];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Gradient background */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-br from-background via-slate-900/50 to-background' 
          : 'bg-gradient-to-br from-background via-slate-100/80 to-background'
      }`}></div>
      
      {/* Add grid pattern */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-grid-white/[0.02]' 
          : 'bg-grid-black/[0.02]'
      } bg-[length:30px_30px]`}></div>
      
      {/* Floating bubbles */}
      {bubbles.map((bubble, i) => (
        <FloatingBubble 
          key={i} 
          size={bubble.size} 
          delay={bubble.delay} 
          duration={bubble.duration}
          x={bubble.x}
          y={bubble.y}
          color={`rgba(var(--primary), ${isDark ? 0.3 : 0.2})`}
        >
          {bubble.icon}
        </FloatingBubble>
      ))}
      
      {/* Subtle light effect */}
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-[100px]"></div>
      <div className="absolute bottom-1/3 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full filter blur-[100px]"></div>
    </div>
  );
};

// Stat card with animation
const StatCard = ({ title, value, icon, trend, delay = 0 }) => {
  const controls = useAnimation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.4,
        ease: "easeOut"
      }
    });
  }, [controls, delay]);
  
  const getTrendColor = () => {
    if (trend > 0) return 'text-emerald-500';
    if (trend < 0) return 'text-rose-500';
    return 'text-muted-foreground';
  };
  
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend < 0) return <TrendingUp className="h-3 w-3 rotate-180" />;
    return null;
  };
  
  return (
    <motion.div
      className={`rounded-xl overflow-hidden border backdrop-blur-sm
        ${isDark ? 'bg-card/50 border-border/50' : 'bg-card/70 border-border/40'}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-full ${isDark ? 'bg-primary/10' : 'bg-primary/5'} text-primary`}>
            {icon}
          </div>
        </div>
        
        <div className="flex items-end gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-0.5">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle animated gradient at bottom */}
      <div className="h-1.5">
        <motion.div 
          className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          animate={{ 
            x: ['-100%', '100%'],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    </motion.div>
  );
};

// Activity bar that shows activity by hour
const ActivityBar = ({ height, active = false }) => {
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="w-5 bg-primary/30 rounded-t-sm"
        style={{ height: 0 }}
        animate={{ height }}
        transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
        whileHover={{ backgroundColor: 'rgba(var(--primary), 0.5)' }}
      >
        {active && (
          <motion.div 
            className="w-full h-1 bg-primary rounded-full absolute -top-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
};

// Trending topic pill with animation
const TrendingTopicPill = ({ topic, count, delay = 0 }) => {
  return (
    <motion.div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.15)' }}
    >
      <span>{topic}</span>
      <Badge variant="outline" className="text-xs">{count}</Badge>
    </motion.div>
  );
};

// Interactive 3D card component
const Card3D = ({ children, className }) => {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to card center (in percentage)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);
    
    // Set rotation (reduce intensity for subtlety)
    setRotateX(-mouseY * 5);
    setRotateY(mouseX * 5);
  };
  
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Light reflection effect */}
      <motion.div
        className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      />
    </motion.div>
  );
};

// Main Dashboard component
const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { rooms, upcomingRooms, isLoading: roomsLoading, fetchRooms, joinRoom } = useRoom();
  const [activeTab, setActiveTab] = useState("home");
  const [retryCount, setRetryCount] = useState(0);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isVoiceCommandEnabled } = useVoiceCommand();
  const [showVoiceAlert, setShowVoiceAlert] = useState(false);
  const [homeActiveTab, setHomeActiveTab] = useState<string>('live');
  
  // Framer Motion values for interactive UI
  const scrollYProgress = useMotionValue(0);
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const headerY = useTransform(scrollYProgress, [0, 0.1], [0, -20]);
  
  // Check if it's the first time user sees voice command feature
  useEffect(() => {
    const hasSeenVoiceAlert = localStorage.getItem('hasSeenVoiceAlert');
    if (!hasSeenVoiceAlert) {
      setShowVoiceAlert(true);
      // Mark as seen
      localStorage.setItem('hasSeenVoiceAlert', 'true');
    }
  }, []);

  // Load rooms data
  useEffect(() => {
    let isMounted = true;
    
    const loadRooms = async () => {
      try {
        if (isMounted) {
          const isConnected = await checkConnection();
          if (!isConnected) {
            toast.error('Connection issue detected', {
              description: 'Please check your internet connection and try again'
            });
            return;
          }
          
          await fetchRooms();
          console.log('Rooms fetched successfully in dashboard');
        }
      } catch (error) {
        console.error('Error fetching rooms in dashboard:', error);
        
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadRooms();
          }, 2000);
        } else {
          toast.error('Having trouble loading rooms. Please refresh.');
        }
      }
    };
    
    loadRooms();
    
    // Refresh rooms every 30 seconds
    const interval = setInterval(() => {
      fetchRooms().catch(error => {
        console.error('Error refreshing rooms:', error);
      });
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchRooms, retryCount]);
  
  // Filter rooms when search term or rooms change
  useEffect(() => {
    if (!rooms) return;
    
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = rooms.filter(room => {
      return (
        room.title.toLowerCase().includes(term) ||
        room.description?.toLowerCase().includes(term) ||
        room.speakers?.some((speaker: any) => 
          speaker?.username?.toLowerCase().includes(term)
        )
      );
    });
    
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);

  // Handle room join
  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      
      // Show success toast with animation
      toast.success('Joining room...', {
        description: 'Connecting you to the conversation'
      });
      
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  };
  
  // Handle scheduled room
  const handleScheduledRoom = (roomId: string) => {
    if (profile) {
      // Navigate to the room details page where users can set a reminder
      // For now, just show a toast message
      toast.info('You will be able to join this room when it goes live');
    } else {
      navigate('/auth', { state: { from: `/` } });
    }
  };
  
  const handleCreateRoom = () => {
    navigate('/create-room');
  };
  
  // For demo purposes - add random data to the rooms
  const enhancedRooms = filteredRooms.map(room => ({
    ...room,
    isLive: Math.random() > 0.3, // 70% chance of being live
  }));
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring", 
        stiffness: 100
      }
    }
  };
  
  // Generate random stats for the dashboard demo
  const generateStats = () => {
    return [
      { 
        title: "Active Rooms", 
        value: filteredRooms.length || Math.floor(Math.random() * 30) + 10, 
        icon: <Radio size={18} />,
        trend: 12
      },
      { 
        title: "Online Users", 
        value: Math.floor(Math.random() * 1500) + 500, 
        icon: <Users size={18} />,
        trend: 8
      },
      { 
        title: "Your Sessions", 
        value: Math.floor(Math.random() * 20) + 1, 
        icon: <Calendar size={18} />,
        trend: -3
      },
      { 
        title: "Voice Commands", 
        value: Math.floor(Math.random() * 100) + 50, 
        icon: <Mic size={18} />,
        trend: 24
      }
    ];
  };
  
  const stats = generateStats();
  
  // Generate random activity data for the chart
  const generateActivityData = () => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      height: Math.random() * 60 + 10,
      active: i === new Date().getHours()
    }));
  };
  
  const activityData = generateActivityData();
  
  // Generate trending topics
  const trendingTopics = [
    { topic: "Music Production", count: 24 },
    { topic: "Tech News", count: 18 },
    { topic: "Language Exchange", count: 15 },
    { topic: "Startup Ideas", count: 12 },
    { topic: "Book Club", count: 10 },
    { topic: "Meditation", count: 9 },
  ];
  
  // Function to load more rooms
  const loadMoreRooms = async () => {
    try {
      setIsRetrying(true);
      toast.promise(fetchRooms(), {
        loading: 'Loading more rooms...',
        success: 'New rooms loaded successfully',
        error: 'Failed to load rooms'
      });
    } catch (error) {
      console.error('Error fetching more rooms:', error);
    } finally {
      setIsRetrying(false);
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
  
  const isPageLoading = roomsLoading;
  
  // Add this inside the Dashboard component, after loadRooms function
  useEffect(() => {
    const prefetchSpeakerAvatars = async () => {
      if (!rooms || rooms.length === 0) return;
      
      // Extract all unique speaker IDs from rooms
      const speakerIds = rooms.flatMap(room => 
        room.speakers?.filter(speaker => speaker?.id).map(speaker => speaker.id) || []
      );
      
      if (speakerIds.length > 0) {
        console.log(`Prefetching avatars for ${speakerIds.length} speakers`);
        await prefetchAvatars(speakerIds);
      }
    };
    
    if (!roomsLoading && rooms.length > 0) {
      prefetchSpeakerAvatars();
    }
  }, [rooms, roomsLoading]);
  
  return (
    <>
      <BubblesBackground />
      
      <div className="px-4 pt-6 pb-20 md:px-8 min-h-screen">
        {/* Header with logo - animated on scroll */}
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 sticky top-0 z-30 pt-4 pb-4 backdrop-blur-sm"
          style={{ opacity, y: headerY }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <PlatformLogo size="lg" className="mr-3" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </motion.div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full"
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button onClick={handleCreateRoom} className="shrink-0 rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                New Room
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Voice command alerts */}
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

        {/* Greeting with animation */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold">
            Welcome{profile?.name ? `, ${profile.name}` : ''}! 
          </h2>
          <p className="text-muted-foreground">
            {filteredRooms.length > 0
              ? `${filteredRooms.length} ${filteredRooms.length === 1 ? 'room' : 'rooms'} available for you to join`
              : 'No rooms found matching your criteria'}
          </p>
        </motion.div>
        
        {/* Stats cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                delay={index * 0.1}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Main content area with tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="explore" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="h-4 w-4 mr-2" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          {/* Home Tab - Contains the content from Index.tsx */}
          <TabsContent value="home" className="space-y-6">
            <Tabs 
              defaultValue="live" 
              className="w-full animate-fade-in"
              value={homeActiveTab}
              onValueChange={setHomeActiveTab}
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
          </TabsContent>
          
          <TabsContent value="explore" className="space-y-8">
            {/* Featured Room Card */}
            {!isPageLoading && enhancedRooms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card3D className={`p-6 md:p-8 mb-8 
                  ${isDark ? 'bg-card/50 border-border/50' : 'bg-card/70 border-border/40'}
                  relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-[80px] -translate-y-1/4 translate-x-1/4"></div>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                      <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">Featured Room</Badge>
                      <h3 className="text-2xl font-bold mb-2">
                        {enhancedRooms[0]?.title || "Join Today's Top Conversation"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {enhancedRooms[0]?.description || "Connect with others in our most popular voice room. Share ideas, listen to experts, and engage in meaningful conversations."}
                      </p>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="outline">Music</Badge>
                        <Badge variant="outline">Technology</Badge>
                        <Badge variant="outline">Creative</Badge>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-3">
                        <Button onClick={() => handleJoinRoom(enhancedRooms[0]?.id)} className="gap-2">
                          <Headphones className="h-4 w-4" />
                          Join Room
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Crown className="h-4 w-4" />
                          Host Similar
                        </Button>
                      </div>
                    </div>
                    <div className="relative min-w-[200px] h-[200px] rounded-full bg-primary/10 flex items-center justify-center">
                      <motion.div 
                        className="absolute inset-0 rounded-full"
                        animate={{ 
                          boxShadow: [
                            '0 0 0 0 rgba(var(--primary), 0.3)',
                            '0 0 0 15px rgba(var(--primary), 0)',
                            '0 0 0 0 rgba(var(--primary), 0)'
                          ]
                        }}
                        transition={{ 
                          duration: 2.5, 
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      />
                      
                      {/* Audio wave visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full border-2 border-primary/30"
                            animate={{ 
                              width: [70, 180],
                              height: [70, 180],
                              opacity: [0.5, 0]
                            }}
                            transition={{ 
                              duration: 3, 
                              ease: "easeOut",
                              repeat: Infinity,
                              delay: i * 0.6
                            }}
                          />
                        ))}
                      </div>
                      
                      <motion.div 
                        className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Mic size={36} className="text-primary-foreground" />
                      </motion.div>
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            )}
            
            {/* Rooms Grid */}
            <AnimatePresence mode="wait">
              {isPageLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-10 w-10 text-primary" />
                  </motion.div>
                  <p className="text-muted-foreground mt-4">Loading rooms for you...</p>
                </div>
              ) : enhancedRooms.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {enhancedRooms.map((room, index) => (
                    <motion.div 
                      key={room.id} 
                      variants={itemVariants}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <EnhancedRoomCard 
                        room={room} 
                        onClick={() => handleJoinRoom(room.id)} 
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card/50 backdrop-blur-sm border rounded-xl p-8 text-center"
                >
                  <div className="max-w-md mx-auto">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Sparkles className="h-8 w-8 text-primary" />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm 
                        ? `No rooms match your search for "${searchTerm}"`
                        : "There are no active rooms at the moment. Create your own room or check back later!"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button variant="default" onClick={handleCreateRoom}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create a Room
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline" 
                          onClick={loadMoreRooms} 
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Load more button */}
            {enhancedRooms.length > 0 && (
              <motion.div 
                className="flex justify-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  variant="outline" 
                  className="rounded-full px-8"
                  onClick={loadMoreRooms}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load More Rooms
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="trending" className="space-y-8">
            {/* Top trending rooms */}
            <Card className={`border backdrop-blur-sm overflow-hidden
              ${isDark ? 'bg-card/50' : 'bg-card/70'}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Now
                </CardTitle>
                <CardDescription>The most popular topics and rooms right now</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-6">
                  {trendingTopics.map((topic, index) => (
                    <TrendingTopicPill 
                      key={index}
                      topic={topic.topic}
                      count={topic.count}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  {/* Featured trending rooms */}
                  {[...enhancedRooms]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map((room, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className={`p-4 rounded-lg border border-border/50 flex gap-4 items-center
                        ${isDark ? 'bg-background/40' : 'bg-background/70'}`}
                      onClick={() => handleJoinRoom(room.id)}
                      whileHover={{ scale: 1.01, backgroundColor: isDark ? 'rgba(var(--background), 0.6)' : 'rgba(var(--background), 0.9)' }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {index === 0 ? <Crown className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{room.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={`https://avatar.vercel.sh/t${index}`}
                              alt="User"
                              size="sm"
                              className="h-6 w-6"
                            />
                            <span className="text-sm font-medium">{trendingTopics[index % trendingTopics.length].topic}</span>
                          </div>
                        </div>
                      </div>
                      
                      {index === 0 && (
                        <Badge className="ml-auto bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                          #1 Trending
                        </Badge>
                      )}
                      
                      {(room.isLive) && (
                        <motion.div 
                          className="ml-auto flex items-center gap-1 text-primary"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.div
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span className="text-xs font-medium">LIVE</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button variant="ghost" className="ml-auto gap-1">
                  View all trends <ArrowRight size={14} />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recommended for you */}
            <Card className={`border backdrop-blur-sm
              ${isDark ? 'bg-card/50' : 'bg-card/70'}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Recommended for You
                </CardTitle>
                <CardDescription>Based on your interests and listening history</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...enhancedRooms]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 4)
                    .map((room, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className={`p-4 rounded-lg border border-border/50
                        ${isDark ? 'bg-background/40' : 'bg-background/70'}`}
                      onClick={() => handleJoinRoom(room.id)}
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 className="font-medium mb-1 truncate">{room.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {room.description || "Join this interesting conversation!"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {['Music', 'Podcast', 'Discussion', 'Learning'][index % 4]}
                        </Badge>
                        
                        <motion.div
                          className="flex items-center gap-1"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 100) + 10}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-8">
            {/* Daily activity chart */}
            <Card className={`border backdrop-blur-sm
              ${isDark ? 'bg-card/50' : 'bg-card/70'}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Today's Activity
                </CardTitle>
                <CardDescription>Room activity across the platform during the day</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="h-64 flex items-end justify-between px-2">
                  {activityData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <ActivityBar height={item.height} active={item.active} />
                      <span className="text-xs text-muted-foreground">
                        {item.hour % 12 === 0 ? 12 : item.hour % 12}
                        {item.hour >= 12 ? 'pm' : 'am'}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8">
                  <h4 className="font-medium mb-4">Peak Hours</h4>
                  <div className="space-y-3">
                    {activityData
                      .sort((a, b) => b.height - a.height)
                      .slice(0, 3)
                      .map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {item.hour % 12 === 0 ? 12 : item.hour % 12}
                              {item.hour >= 12 ? 'pm' : 'am'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(item.height * 10)} active users
                            </span>
                          </div>
                          <Progress value={item.height} max={100} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent notifications */}
            <Card className={`border backdrop-blur-sm
              ${isDark ? 'bg-card/50' : 'bg-card/70'}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border border-border/50 flex gap-3 items-start
                          ${isDark ? 'bg-background/40' : 'bg-background/70'}`}
                      >
                        <Avatar 
                          src={`https://avatar.vercel.sh/${index}${Math.random()}`}
                          alt="User"
                          size="sm"
                          className="h-9 w-9"
                        />
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">User {index + 1}</p>
                            <span className="text-xs text-muted-foreground">{index + 1}h ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {index % 2 === 0 
                              ? `Joined your room "${['Music Talk', 'Tech Chat', 'Creative Space'][index % 3]}"`
                              : `Mentioned you in a comment`
                            }
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter>
                <Button variant="ghost" className="ml-auto gap-1">
                  View all notifications <ArrowRight size={14} />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Dashboard;