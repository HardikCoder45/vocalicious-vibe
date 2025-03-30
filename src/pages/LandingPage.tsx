import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import PlatformLogo from '@/components/PlatformLogo';
import { 
  ArrowRight, 
  Mic, 
  Headphones, 
  Users, 
  Music, 
  Radio, 
  MessageCircle,
  BookOpen,
  Globe,
  Zap,
  PlayCircle,
  VolumeX,
  Volume2
} from 'lucide-react';

// Animated section that reveals when scrolled into view
const AnimatedSection = ({ 
  children, 
  delay = 0,
  className = "" 
}: { 
  children: React.ReactNode, 
  delay?: number,
  className?: string 
}) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Room preview card with animations
const RoomPreview = ({ 
  title, 
  participants, 
  category, 
  active = false,
  delay = 0 
}: { 
  title: string, 
  participants: number, 
  category: string,
  active?: boolean,
  delay?: number 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`
        relative p-6 rounded-xl backdrop-blur-lg shadow-lg border overflow-hidden
        ${isDark 
          ? 'bg-card/40 border-border/50 hover:border-primary/50' 
          : 'bg-card/60 border-border/30 hover:border-primary/30'
        }
      `}
    >
      {/* Audio wave animation at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center gap-[2px] opacity-40">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[2px] bg-primary rounded-t-full"
            initial={{ height: 2 }}
            animate={{ 
              height: active 
                ? [
                    2,
                    Math.random() * 20 + 2,
                    Math.random() * 10 + 2,
                    Math.random() * 25 + 2,
                    2
                  ] 
                : 2
            }}
            transition={{ 
              duration: 1.5,
              repeat: active ? Infinity : 0,
              delay: i * 0.05 % 1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Room info */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-full bg-primary/15 text-primary">
            {category === 'Music' && <Music size={18} />}
            {category === 'Podcast' && <Radio size={18} />}
            {category === 'Discussion' && <MessageCircle size={18} />}
            {category === 'Learning' && <BookOpen size={18} />}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {category}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{participants} listening</span>
          </div>
          
          {active ? (
            <motion.div 
              className="flex items-center gap-1.5 text-primary"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs font-medium">LIVE</span>
              <span className="w-2 h-2 rounded-full bg-primary"></span>
            </motion.div>
          ) : (
            <Button variant="ghost" size="sm" className="px-2 h-7">
              <PlayCircle size={16} className="mr-1" />
              <span className="text-xs">Join</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  index 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  index: number
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -5 }}
      className={`
        p-6 rounded-xl shadow-md backdrop-blur-sm border
        ${isDark 
          ? 'bg-card/30 border-border/50 hover:border-primary/40' 
          : 'bg-card/70 border-border/30 hover:border-primary/30'
        }
      `}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-full bg-primary/15 text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
};

// Voice wave animation component
const VoiceWaveAnimation = ({ size = 'md', active = true, className = "" }: { 
  size?: 'sm' | 'md' | 'lg',
  active?: boolean,
  className?: string
}) => {
  const sizesMap = {
    sm: "w-32 h-32",
    md: "w-56 h-56",
    lg: "w-96 h-96"
  };
  
  return (
    <div className={`relative ${sizesMap[size]} ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        {active && Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-primary/30"
            animate={{ 
              width: [size === 'sm' ? 40 : 60, size === 'lg' ? 500 : 350],
              height: [size === 'sm' ? 40 : 60, size === 'lg' ? 500 : 350],
              opacity: [0.7, 0]
            }}
            transition={{ 
              duration: 3, 
              ease: "easeOut",
              repeat: Infinity,
              delay: i * 0.8
            }}
          />
        ))}
        
        <motion.div 
          className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center"
          animate={active ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 0 0 rgba(var(--primary), 0.2)',
              '0 0 0 10px rgba(var(--primary), 0)',
              '0 0 0 0 rgba(var(--primary), 0)'
            ]
          } : {}}
          transition={{ 
            duration: 2, 
            repeat: active ? Infinity : 0,
            repeatType: "loop"
          }}
        >
          {active ? (
            <Volume2 size={22} className="text-primary-foreground" />
          ) : (
            <VolumeX size={22} className="text-primary-foreground" />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Background animated waveform
const AnimatedBackground = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Gradient background */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950' 
          : 'bg-gradient-to-br from-purple-50 via-slate-100 to-white'
      }`}></div>
      
      {/* Animated elements */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${isDark ? 'bg-primary/5' : 'bg-primary/3'}`}
          style={{
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: Math.random() * 0.5 + 0.5, 
            opacity: Math.random() * 0.2 + 0.05,
            x: Math.random() * 150 - 75,
            y: Math.random() * 150 - 75,
          }}
          transition={{ 
            duration: Math.random() * 20 + 10, 
            repeat: Infinity, 
            repeatType: "reverse",
            delay: Math.random() * 5 
          }}
        />
      ))}
      
      {/* Grid pattern overlay */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-grid-white/[0.02]' 
          : 'bg-grid-black/[0.02]'
      } bg-[length:50px_50px]`}></div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [animationComplete, setAnimationComplete] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    // Trigger animation completion after initial animations
    const timer = setTimeout(() => setAnimationComplete(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  // Sample room data
  const popularRooms = [
    { 
      title: "Evening Jazz & Lofi Beats", 
      participants: 243, 
      category: "Music", 
      active: true 
    },
    { 
      title: "Tech Talk: AI Revolution", 
      participants: 156, 
      category: "Podcast", 
      active: true 
    },
    { 
      title: "Learn Spanish with Friends", 
      participants: 87, 
      category: "Learning", 
      active: false 
    },
    { 
      title: "Startup Founders Networking", 
      participants: 119, 
      category: "Discussion", 
      active: true 
    }
  ];
  
  // Features section data
  const features = [
    {
      icon: <Mic size={24} />,
      title: "Voice-Controlled",
      description: "Control your entire experience with just your voice. Skip songs, join rooms, or create discussions without lifting a finger."
    },
    {
      icon: <Users size={24} />,
      title: "Social Audio Rooms",
      description: "Join vibrant communities in real-time voice rooms. Listen to experts, join discussions, or just hang out with like-minded people."
    },
    {
      icon: <Radio size={24} />,
      title: "Live Podcasts",
      description: "Listen to or host your own live podcasts with studio-quality audio. Interact with listeners in real-time."
    },
    {
      icon: <BookOpen size={24} />,
      title: "Learning Spaces",
      description: "Create dedicated rooms for language exchange, skill-sharing, or educational discussions. Learn together with voice-based interaction."
    },
    {
      icon: <Music size={24} />,
      title: "Music Sharing",
      description: "Experience music together with friends. Create collaborative playlists and enjoy synchronized listening parties."
    },
    {
      icon: <Globe size={24} />,
      title: "Global Community",
      description: "Connect with people worldwide who share your interests, from music fans to entrepreneurs to language learners."
    }
  ];
  
  return (
    <div className="relative min-h-screen overflow-x-hidden scroll-smooth">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="pt-6 sm:pt-8 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex justify-between items-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <PlatformLogo size="lg" />
              <span className="text-2xl font-bold">Vocalicious Vibe</span>
            </div>
            <Button onClick={() => navigate('/auth')} className="px-6">
              Get Started
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex-1 z-10 relative">
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 md:pr-8 mb-12 md:mb-0">
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  Your Voice is <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">All You Need</span>
                </motion.h1>
                
                <motion.p 
                  className="text-xl text-muted-foreground mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  Join the social audio platform where conversations come alive. Create and join audio rooms for podcasts, music, learning, or just hanging out — all controlled with your voice.
                </motion.p>
                
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  <Button 
                    size="lg" 
                    className="text-md px-8 py-6 rounded-full font-medium"
                    onClick={() => navigate('/auth')}
                  >
                    Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-md px-8 py-6 rounded-full font-medium"
                    onClick={() => {
                      const featuresEl = document.getElementById('features');
                      featuresEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    See Features <Zap className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="w-full md:w-1/2 flex justify-center">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  {/* Main room visualization */}
                  <div className={`
                    relative rounded-2xl p-6 shadow-xl overflow-hidden
                    ${isDark 
                      ? 'bg-card/40 border border-border/50' 
                      : 'bg-card/70 border border-border/30'
                    }
                    w-[320px] sm:w-[380px] h-[320px] sm:h-[380px] backdrop-blur-md
                  `}>
                    <VoiceWaveAnimation size="lg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-xl font-bold mb-2">The Jazz Lounge</h3>
                      <p className="text-sm text-muted-foreground mb-2">Relaxing evening jazz with host DJMiles</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-background/80' : 'border-background'}`}
                              style={{
                                backgroundColor: [
                                  'rgb(var(--primary))', 
                                  '#818cf8', 
                                  '#e879f9', 
                                  '#22d3ee'
                                ][i]
                              }}
                            />
                          ))}
                          <div className={`
                            w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium
                            ${isDark ? 'border-background/80 bg-muted' : 'border-background bg-muted'}
                          `}>
                            +62
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-primary">
                          <motion.div
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-xs font-medium">LIVE</span>
                          </motion.div>
                          <motion.div
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating mini room cards */}
                  <motion.div
                    className="absolute -bottom-8 -right-20 w-48"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.9 }}
                  >
                    <div className={`
                      rounded-lg p-4 shadow-lg
                      ${isDark 
                        ? 'bg-card/60 border border-border/60' 
                        : 'bg-card/80 border border-border/40'
                      }
                      backdrop-blur-md
                    `}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-primary/15 text-primary">
                          <Music size={14} />
                        </div>
                        <span className="text-xs font-medium">Pop Hits 2024</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">32 listening</span>
                        <div className="w-16 h-3 flex items-end gap-[1px]">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              className="w-1 bg-primary rounded-t-full"
                              animate={{ height: [
                                2,
                                Math.random() * 10 + 2,
                                Math.random() * 5 + 2,
                                2
                              ] }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.1 % 0.5
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -top-10 -left-16 w-44"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 1.1 }}
                  >
                    <div className={`
                      rounded-lg p-4 shadow-lg
                      ${isDark 
                        ? 'bg-card/60 border border-border/60' 
                        : 'bg-card/80 border border-border/40'
                      }
                      backdrop-blur-md
                    `}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-primary/15 text-primary">
                          <BookOpen size={14} />
                        </div>
                        <span className="text-xs font-medium">Spanish Lessons</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">14 learning</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          Join
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Popular Rooms Section */}
        <AnimatedSection className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Popular Right Now</h2>
                <p className="text-muted-foreground">Join these trending rooms and join the conversation</p>
              </div>
              <Button variant="ghost" className="gap-1">
                Explore all <ArrowRight size={16} />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularRooms.map((room, index) => (
                <RoomPreview 
                  key={index}
                  title={room.title}
                  participants={room.participants}
                  category={room.category}
                  active={room.active}
                  delay={0.2 + index * 0.1}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
        
        {/* Features Section */}
        <AnimatedSection id="features" className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose Vocalicious Vibe?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed to make social audio experiences seamless, interactive, and completely voice-controlled.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
        
        {/* How It Works Section */}
        <AnimatedSection className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="w-full lg:w-1/2">
                <h2 className="text-3xl font-bold mb-6">How It Works</h2>
                
                <div className="space-y-8">
                  {[
                    {
                      step: 1,
                      title: "Create an account",
                      description: "Sign up in seconds and customize your profile."
                    },
                    {
                      step: 2,
                      title: "Explore or create rooms",
                      description: "Join existing rooms or create your own for any topic."
                    },
                    {
                      step: 3,
                      title: "Use voice commands",
                      description: "Control everything hands-free with simple voice commands."
                    },
                    {
                      step: 4,
                      title: "Connect with others",
                      description: "Follow friends, join discussions, and build your network."
                    }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="w-full lg:w-1/2 flex justify-center">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className={`
                    relative w-[300px] sm:w-[380px] h-[500px] rounded-2xl shadow-xl overflow-hidden
                    ${isDark 
                      ? 'bg-card/30 border border-border/50' 
                      : 'bg-card/50 border border-border/30'
                    }
                    backdrop-blur-sm
                  `}>
                    {/* Phone frame mockup */}
                    <div className="absolute top-0 w-1/3 h-6 bg-background/20 left-1/2 transform -translate-x-1/2 rounded-b-xl" />
                    
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">Discovery</h3>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users size={16} className="text-primary" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        {/* Room categories */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {['All', 'Music', 'Podcast', 'Learning', 'Tech', 'Social'].map((cat, i) => (
                            <div 
                              key={i} 
                              className={`
                                py-1.5 px-3 rounded-full text-sm whitespace-nowrap
                                ${i === 0 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'}
                              `}
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                        
                        {/* Mini room cards */}
                        <div className="space-y-3">
                          {[
                            { title: "Daily Meditation", category: "Wellness", users: 24, active: true },
                            { title: "React Development Q&A", category: "Tech", users: 56, active: true },
                            { title: "Lofi Beats for Study", category: "Music", users: 132, active: true },
                          ].map((room, i) => (
                            <motion.div 
                              key={i}
                              className={`
                                p-4 rounded-lg
                                ${isDark 
                                  ? 'bg-background/40 hover:bg-background/60' 
                                  : 'bg-background/70 hover:bg-background/90'}
                                transition-colors
                              `}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.5 + i * 0.2 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{room.title}</h4>
                                <span className="text-xs rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                                  {room.category}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} className="text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{room.users}</span>
                                </div>
                                
                                <div className="flex gap-2 items-center">
                                  {room.active && (
                                    <motion.div
                                      className="flex items-center gap-1"
                                      animate={{ opacity: [0.7, 1, 0.7] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    >
                                      <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      />
                                      <span className="text-[10px] text-primary">LIVE</span>
                                    </motion.div>
                                  )}
                                  
                                  <Button variant="ghost" size="sm" className="h-7 px-2">
                                    <PlayCircle size={14} className="mr-1" />
                                    <span className="text-xs">Join</span>
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Voice command indicator */}
                      <motion.div 
                        className={`
                          mt-4 p-3 rounded-lg border flex items-center gap-3
                          ${isDark 
                            ? 'bg-background/30 border-primary/20' 
                            : 'bg-background/50 border-primary/20'}
                        `}
                        animate={{ 
                          boxShadow: [
                            '0 0 0 0 rgba(var(--primary), 0)',
                            '0 0 0 3px rgba(var(--primary), 0.1)',
                            '0 0 0 0 rgba(var(--primary), 0)'
                          ]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Mic size={16} className="text-primary" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">Voice command</div>
                          <div className="text-sm font-medium">"Join React Development room"</div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Call to Action Section */}
        // ... existing code above ...

{/* Call to Action Section */}
<AnimatedSection className="py-20 px-6">
  <div className={`
    max-w-5xl mx-auto rounded-2xl p-12 relative overflow-hidden
    ${isDark 
      ? 'bg-card/30 border border-border/40' 
      : 'bg-card/50 border border-border/30'
    }
    backdrop-blur-md shadow-xl
  `}>
    {/* Background effect */}
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: Math.random() * 300 + 100,
            height: Math.random() * 300 + 100,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
    
    <div className="relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to experience the power of your voice?
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Join thousands of users already connecting, learning, and sharing through voice-controlled audio rooms.
        </p>
        
        <Button 
          size="lg" 
          className="text-lg px-10 py-7 rounded-full font-medium"
          onClick={() => navigate('/auth')}
        >
          Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
      
      {/* Voice visualization */}
      <motion.div 
        className="mt-12 h-16 flex items-end justify-center gap-1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-primary/40"
            style={{ height: 4 }}
            animate={{ 
              height: [
                4,
                Math.sin(i * 0.2) * 30 + Math.random() * 20 + 4,
                4
              ] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.05 % 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </div>
  </div>
</AnimatedSection>

{/* Testimonials */}
<AnimatedSection className="py-16 px-6">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl font-bold mb-10 text-center">What Our Users Say</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        {
          name: "Sarah J.",
          role: "Podcast Host",
          testimonial: "Vocalicious Vibe has transformed how I connect with my audience. The voice-control feature makes hosting my podcast so much more seamless.",
          avatar: "S"
        },
        {
          name: "Marcus T.",
          role: "Music Producer",
          testimonial: "I love creating music rooms where I can get real-time feedback on my tracks. The audio quality is fantastic, and the community is supportive.",
          avatar: "M"
        },
        {
          name: "Elena K.",
          role: "Language Learner",
          testimonial: "I've improved my Spanish so much by joining language exchange rooms. Being able to navigate with just my voice makes the experience truly immersive.",
          avatar: "E"
        }
      ].map((testimonial, index) => (
        <motion.div 
          key={index}
          className={`
            p-6 rounded-xl shadow-md backdrop-blur-sm border
            ${isDark 
              ? 'bg-card/20 border-border/50' 
              : 'bg-card/60 border-border/30'
            }
          `}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
        >
          <div className="flex gap-4 items-start mb-4">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
              ${index === 0 ? 'bg-purple-200 text-purple-700' : 
                index === 1 ? 'bg-blue-200 text-blue-700' :
                'bg-emerald-200 text-emerald-700'}
            `}>
              {testimonial.avatar}
            </div>
            <div>
              <h4 className="font-bold text-lg">{testimonial.name}</h4>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>
          
          <p className="text-muted-foreground">"{testimonial.testimonial}"</p>
          
          <div className="mt-4 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg 
                key={i}
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-primary" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</AnimatedSection>
</main>

{/* Footer */}
<footer className="py-12 px-6 border-t border-border/20 backdrop-blur-sm relative z-10">
<div className="max-w-7xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
    <div className="md:col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <PlatformLogo size="md" />
        <span className="text-xl font-bold">Vocalicious Vibe</span>
      </div>
      <p className="text-muted-foreground mb-4">
        Your voice-controlled social audio platform for connecting, learning, and sharing.
      </p>
      <div className="flex gap-4">
        {['twitter', 'facebook', 'instagram', 'github'].map((social, i) => (
          <a 
            key={i} 
            href="#" 
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <span className="sr-only">{social}</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        ))}
      </div>
    </div>
    
    <div>
      <h4 className="font-bold mb-4">Quick Links</h4>
      <ul className="space-y-2">
        {['Home', 'About', 'Features', 'Pricing', 'Contact'].map((link, i) => (
          <li key={i}>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
    
    <div>
      <h4 className="font-bold mb-4">Features</h4>
      <ul className="space-y-2">
        {['Voice Control', 'Audio Rooms', 'Podcasts', 'Music Sharing', 'Learning Spaces'].map((link, i) => (
          <li key={i}>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
    
    <div>
      <h4 className="font-bold mb-4">Legal</h4>
      <ul className="space-y-2">
        {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Data Processing'].map((link, i) => (
          <li key={i}>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </div>
  
  <div className="mt-12 pt-6 border-t border-border/20 flex flex-col md:flex-row justify-between items-center">
    <p className="text-sm text-muted-foreground">
      © {new Date().getFullYear()} Vocalicious Vibe. All rights reserved.
    </p>
    <div className="mt-4 md:mt-0">
      <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        Back to top
      </Button>
    </div>
  </div>
</div>
</footer>
</div>
);
};

export default LandingPage;