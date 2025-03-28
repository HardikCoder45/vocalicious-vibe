
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';
import { RoomData } from '@/context/RoomContext';

interface RoomCardProps {
  room: RoomData;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const navigate = useNavigate();
  
  const handleJoin = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/room/${room.id}`);
    }
  };
  
  return (
    <Card 
      className={`room-card transition-all duration-500 hover:translate-y-[-5px] overflow-hidden group`}
    >
      {/* Gradient header background */}
      <div className={`absolute top-0 left-0 w-full h-1/3 bg-gradient-to-r ${room.color} opacity-20`} />
      
      <CardHeader className="relative z-10 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.topic}</p>
          </div>
          {room.isLive && (
            <Badge variant="destructive" className="animate-pulse uppercase font-semibold">
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <p className="text-sm mb-4 line-clamp-2">{room.description}</p>
        
        <div className="flex -space-x-3 mb-3">
          {room.speakers.map((speaker, index) => (
            <div key={speaker.id} className="relative" style={{ zIndex: 10 - index }}>
              <Avatar 
                src={speaker.avatar} 
                alt={speaker.name} 
                size="sm" 
                speaking={speaker.isSpeaking}
                id={speaker.id}
              />
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users size={16} className="mr-1" />
          <span>{room.participants}</span>
        </div>
        
        <Button 
          onClick={handleJoin}
          variant="outline" 
          className="transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
