
import React, { useState } from 'react';
import { User, useUser } from '@/context/UserContext';
import Avatar from '@/components/Avatar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, Users, Mic, BookMarked, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import RoomCard from '@/components/RoomCard';
import { useRoom } from '@/context/RoomContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';

const ProfilePage = () => {
  const { currentUser, updateProfile } = useUser();
  const { rooms, joinRoom } = useRoom();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User> | null>(null);
  
  const handleEdit = () => {
    setFormData(currentUser || null);
    setIsEditing(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleSave = async () => {
    if (formData) {
      await updateProfile(formData);
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
    navigate(`/room/${roomId}`);
  };
  
  // Filter rooms for "my rooms" tab - rooms where the user is a speaker
  const myRooms = rooms.filter(room => 
    room.speakers.some(speaker => speaker.id === currentUser?.id)
  );
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-20 w-20 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-6 w-40 bg-muted rounded mx-auto mb-2"></div>
          <div className="h-4 w-60 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 pt-8 pb-6 md:px-8 text-center animate-fade-in relative overflow-hidden">
        <div className="mb-6">
          <Avatar 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            size="xl" 
          />
        </div>
        
        {!isEditing ? (
          <div>
            <h1 className="text-2xl font-bold mb-1">{currentUser.name}</h1>
            <p className="text-muted-foreground mb-2">@{currentUser.username}</p>
            <p className="mb-4 max-w-md mx-auto">{currentUser.bio}</p>
            
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="font-semibold">{currentUser.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{currentUser.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {currentUser.interests.map(interest => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="space-y-4">
              <div>
                <Input
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleChange}
                  placeholder="Name"
                  className="mb-2"
                />
                <Input
                  name="username"
                  value={formData?.username || ''}
                  onChange={handleChange}
                  placeholder="Username"
                />
              </div>
              
              <Textarea
                name="bio"
                value={formData?.bio || ''}
                onChange={handleChange}
                placeholder="Bio"
                rows={3}
              />
              
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <Separator />
      
      <main className="px-4 md:px-8 py-6">
        <Tabs defaultValue="rooms" className="w-full animate-fade-in">
          <TabsList className="mb-6">
            <TabsTrigger value="rooms" className="gap-2">
              <Mic className="h-4 w-4" />
              My Rooms
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="recordings" className="gap-2">
              <BookMarked className="h-4 w-4" />
              Recordings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rooms" className="animate-fade-in">
            {myRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((room, index) => (
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
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Mic className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No rooms yet</h3>
                <p className="mb-4">You haven't created or joined any rooms as a speaker</p>
                <Button onClick={() => navigate('/create-room')}>Create a Room</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="schedule" className="animate-fade-in">
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">No scheduled rooms</h3>
              <p className="mb-4">You don't have any upcoming scheduled rooms</p>
              <Button onClick={() => navigate('/create-room')}>Schedule a Room</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="recordings" className="animate-fade-in">
            <div className="py-12 text-center text-muted-foreground">
              <BookMarked className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">No recordings</h3>
              <p className="mb-4">You don't have any saved recordings yet</p>
              <Button variant="outline">Learn about recordings</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProfilePage;
