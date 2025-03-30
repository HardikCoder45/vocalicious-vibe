import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Users } from "lucide-react";
import { RoomData } from '@/context/RoomContext';
import Avatar from './Avatar';

interface RoomCardProps {
  room: RoomData;
  onClick?: () => void;
}

const RoomCard = ({ room, onClick }: RoomCardProps) => {
  // Defensive coding: ensure room data exists with defaults
  if (!room) {
    console.error("RoomCard received undefined room data");
    return null;
  }
  
  const { 
    name = 'Unnamed Room', 
    description = '', 
    participants = 0, 
    speakers = [], 
    topic = 'General', 
    color = 'from-purple-500 to-pink-500', 
    isLive = false 
  } = room;
  
  // Get moderators and active speakers - ensure speakers is an array
  const speakersArray = Array.isArray(speakers) ? speakers : [];
  const moderators = speakersArray.filter(speaker => speaker && speaker.isModerator);
  const activeSpeakers = speakersArray.filter(speaker => speaker && speaker.isSpeaking);
  
  return (
    <div className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
      <Card
        className="overflow-hidden cursor-pointer h-full border-1 hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className={`h-3 bg-gradient-to-r ${color}`}></div>
        <CardContent className="p-4 relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="whitespace-nowrap text-xs">
                  {topic}
                </Badge>
              </div>
            </div>
            
            <Badge 
              variant={isLive ? "destructive" : "secondary"} 
              className={`uppercase text-xs font-medium ${isLive ? 'animate-pulse-slow' : ''}`}
            >
              {isLive ? "Live" : "Upcoming"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex -space-x-3">
              {speakersArray.slice(0, 3).map((speaker, i) => (
                speaker && (
                  <div key={speaker.id || i} className="relative z-10 rounded-full overflow-hidden border-2 border-background" style={{ zIndex: 10 - i }}>
                    <Avatar
                      src={speaker.avatar || null}
                      alt={speaker.name || 'Speaker'}
                      size="sm"
                      active={!!speaker.isModerator}
                      id={speaker.id || `speaker-${i}`}
                      userId={speaker.id}
                    />
                  </div>
                )
              ))}
              
              {speakersArray.length > 3 && (
                <div 
                  className="relative rounded-full flex items-center justify-center bg-muted text-xs font-semibold h-8 w-8 text-center border-2 border-background" 
                  style={{ zIndex: 7 }}
                >
                  +{speakersArray.length - 3}
                </div>
              )}
              
              {speakersArray.length === 0 && (
                <div className="text-xs text-muted-foreground">No speakers yet</div>
              )}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{participants}</span>
            </div>
          </div>
          
          {activeSpeakers.length > 0 && (
            <div className="absolute right-4 bottom-4 flex items-center gap-1 text-destructive text-xs font-semibold">
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              <span>{activeSpeakers.length} speaking</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomCard;
