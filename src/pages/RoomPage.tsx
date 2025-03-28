
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MoreHorizontal, Share2, Heart, Mic } from "lucide-react";
import Avatar from '@/components/Avatar';
import MicrophoneButton from '@/components/MicrophoneButton';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import { useRoom, Speaker } from '@/context/RoomContext';
import { useAudio } from '@/context/AudioContext';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ParticleBackground from '@/components/ParticleBackground';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { rooms, currentRoom, joinRoom, leaveRoom, toggleSpeaking } = useRoom();
  const { isListening, startListening, stopListening } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
      startListening();
      
      // Simulate loading
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => {
        clearTimeout(timer);
        leaveRoom();
        stopListening();
      };
    }
  }, [roomId, joinRoom, leaveRoom, startListening, stopListening]);
  
  const handleBack = () => {
    leaveRoom();
    stopListening();
    navigate('/');
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Room link copied to clipboard");
  };
  
  const handleLike = () => {
    setLiked(!liked);
    toast(liked ? "Removed like" : "You liked this room!");
  };
  
  const handleSpeakerClick = (speakerId: string) => {
    toggleSpeaking(speakerId);
  };
  
  if (!currentRoom && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Room not found</h2>
        <p className="mb-8 text-muted-foreground">The room you're looking for doesn't exist or has ended.</p>
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={50} />
      
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLike}
            className={liked ? 'text-red-500' : ''}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current animate-scale-in' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report room</DropdownMenuItem>
              <DropdownMenuItem onClick={handleBack}>Leave quietly</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        {!isLoading && currentRoom && (
          <>
            {/* Speakers section */}
            <section className="mb-10 animate-fade-in">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Mic className="mr-2 h-5 w-5" />
                Speakers
              </h2>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {currentRoom.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex flex-col items-center">
                    <Avatar
                      src={speaker.avatar}
                      alt={speaker.name}
                      size="lg"
                      speaking={speaker.isSpeaking}
                      active={speaker.isModerator}
                      onClick={() => handleSpeakerClick(speaker.id)}
                      id={speaker.id}
                    />
                    <div className="mt-2 text-center">
                      <p className="font-medium text-sm truncate max-w-full">{speaker.name}</p>
                      {speaker.isModerator && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex flex-col items-center justify-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-16 w-16 rounded-full"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground">Invite</p>
                </div>
              </div>
            </section>
            
            {/* Room description */}
            <section className="mb-8 bg-card p-6 rounded-xl animate-fade-in">
              <h3 className="text-lg font-semibold mb-2">About this room</h3>
              <p className="text-muted-foreground">{currentRoom.description}</p>
            </section>
            
            {/* Live waveform visualization */}
            <section className="mb-10 h-24 flex items-center justify-center animate-fade-in">
              <div className="w-full max-w-lg h-20 flex items-center justify-center">
                <WaveformVisualizer active={true} size="lg" />
              </div>
            </section>
          </>
        )}
        
        {isLoading && (
          <div className="animate-pulse space-y-10">
            <section className="mb-10">
              <div className="h-8 w-40 bg-muted rounded mb-6"></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-muted"></div>
                    <div className="h-4 w-20 bg-muted rounded mt-2"></div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="h-40 bg-muted rounded-xl"></section>
            
            <section className="h-24 bg-muted rounded-xl"></section>
          </div>
        )}
      </main>
      
      {/* Fixed controls at bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-background/80 backdrop-blur-sm border-t p-4 flex justify-center animate-fade-in">
        <div className="w-full max-w-lg flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex-1"
          >
            Leave quietly
          </Button>
          <MicrophoneButton className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
