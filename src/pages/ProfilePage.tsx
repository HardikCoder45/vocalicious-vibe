import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import Avatar from '@/components/Avatar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, Users, Mic, BookMarked, Calendar, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import RoomCard from '@/components/RoomCard';
import { useRoom } from '@/context/RoomContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import { toast } from "sonner";
import AIAvatarGenerator from '@/components/AIAvatarGenerator';
import { supabase } from "@/integrations/supabase/client"
import ProfileHeader from '@/components/ProfileHeader';
import { fetchAvatarAsBase64, clearAvatarCache } from '@/utils/avatarUtils';

const ProfilePage = () => {
  const { profile, updateProfile, isLoading: userLoading } = useUser();
  const { rooms, joinRoom, isLoading: roomsLoading, fetchRooms } = useRoom();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [avatarGeneratorOpen, setAvatarGeneratorOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Initial data loading
    const loadData = async () => {
      try {
        await fetchRooms();
      } catch (error) {
        console.error('Error fetching rooms in profile:', error);
        // Even on error, continue and depend on fallback data
        toast.error('Could not load your rooms, showing sample data instead');
      } finally {
        // Short delay to prevent flashing
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    
    loadData();
  }, [fetchRooms]);
  
  // Function to fetch user avatar blob from Supabase storage
  const fetchUserAvatarBlob = async (userId: string) => {
    if (!userId) return null;
    
    try {
      setIsLoading(true);
      console.log('Fetching avatar blob for user ID:', userId);
      
      // Step 1: Try the direct path first
      const avatarPath = `avatars/${userId}/profile.png`;
      console.log('Looking for avatar at path:', avatarPath);
      
      // Download the file as a blob
      const { data: fileData, error: fileError } = await supabase.storage
        .from('user-content')
        .download(avatarPath);
      
      if (fileError) {
        console.log('Error downloading specific file:', fileError.message);
        
        // Step 2: If specific file not found, try listing files in the directory
        console.log('Trying to list directory contents...');
        const { data: files, error: listError } = await supabase.storage
          .from('user-content')
          .list(`avatars/${userId}`);
        
        if (listError) {
          console.error('Error listing avatar files:', listError);
          setIsLoading(false);
          return null;
        }
        
        console.log('Files found in user directory:', files);
        
        // If there are files, use the most recent one
        if (files && files.length > 0) {
          // Sort files by name to get the most recent (if using timestamp naming)
          const sortedFiles = [...files].sort((a, b) => 
            b.name.localeCompare(a.name)
          );
          
          const fileName = sortedFiles[0].name;
          console.log('Trying to download alternative file:', fileName);
          
          const { data: altFileData, error: altFileError } = await supabase.storage
            .from('user-content')
            .download(`avatars/${userId}/${fileName}`);
          
          if (altFileError) {
            console.error('Error downloading alternative file:', altFileError);
            setIsLoading(false);
            return null;
          }
          
          // If we successfully got the alternative file blob
          if (altFileData) {
            // Create a blob URL to display the image
            const blobUrl = URL.createObjectURL(altFileData);
            console.log('Created blob URL from alternative file:', blobUrl);
            setAvatarBlobUrl(blobUrl);
            
            // Also try to create a base64 URL as a backup
            try {
              const reader = new FileReader();
              reader.readAsDataURL(altFileData);
              reader.onloadend = () => {
                const base64url = reader.result as string;
                setAvatarUrl(base64url);
              };
            } catch (err) {
              console.error('Error creating base64 URL:', err);
            }
            
            setIsLoading(false);
            return blobUrl;
          }
        } else {
          console.log('No avatar files found for user');
          setIsLoading(false);
          return null;
        }
      } else if (fileData) {
        // If we successfully got the file blob
        const blobUrl = URL.createObjectURL(fileData);
        console.log('Created blob URL from specific file:', blobUrl);
        setAvatarBlobUrl(blobUrl);
        
        // Also try to create a base64 URL as a backup
        try {
          const reader = new FileReader();
          reader.readAsDataURL(fileData);
          reader.onloadend = () => {
            const base64url = reader.result as string;
            setAvatarUrl(base64url);
          };
        } catch (err) {
          console.error('Error creating base64 URL:', err);
        }
        
        setIsLoading(false);
        return blobUrl;
      }
      
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error in fetchUserAvatarBlob:', error);
      setIsLoading(false);
      return null;
    }
  };
  
  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl);
        console.log('Revoked blob URL:', avatarBlobUrl);
      }
    };
  }, [avatarBlobUrl]);
  
  // Update the useEffect for avatar fetching
  useEffect(() => {
    if (profile && profile.id) {
      const loadAvatar = async () => {
        try {
          // Fetch avatar directly as base64
          const avatarBase64 = await fetchAvatarAsBase64(profile.id);
          
          if (avatarBase64) {
            console.log('Loaded avatar as base64');
            setAvatarUrl(avatarBase64);
          } else {
            console.log('No avatar found for user');
          }
          
          // Also fetch as blob for certain usages
          await fetchUserAvatarBlob(profile.id);
        } catch (err) {
          console.error('Error loading avatar:', err);
        }
      };
      
      loadAvatar();
    }
  }, [profile]);
  
  useEffect(() => {
    // Update form data when profile changes
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
    
  }, [profile]);
  
  useEffect(() => {
    if (profile) {
      console.log('Profile data:', profile);
      console.log('Avatar URL:', profile.avatar_url);
    }
  }, [profile]);
  
  const handleEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    try {
      // Update state first for immediate feedback
      setAvatarUrl(url);
      
      // If there's a previous blob URL, revoke it to prevent memory leaks
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl);
        setAvatarBlobUrl(null);
      }
      
      // Update profile in database
      await updateProfile({ avatar_url: url });
      
      // Fetch fresh avatar directly from storage
      if (profile?.id) {
        // Small delay to ensure storage has been updated
        setTimeout(async () => {
          const newAvatar = await fetchAvatarAsBase64(profile.id);
          if (newAvatar) {
            setAvatarUrl(newAvatar);
          }
          
          // Also update the blob version
          await fetchUserAvatarBlob(profile.id);
          
          // Force a refresh of the avatar in other components
          const refreshEvent = new CustomEvent('avatar-updated', { detail: { userId: profile.id } });
          window.dispatchEvent(refreshEvent);
        }, 500); // Half-second delay
      }
      
      toast.success('Avatar updated successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
      return Promise.reject(error);
    }
  };
  
  // Filter rooms for "my rooms" tab - rooms where the user is a speaker
  const myRooms = rooms.filter(room => 
    room.speakers.some(speaker => speaker?.id === profile?.id)
  ) || [];
  
  // Ensure we have some rooms to display even if there are none
  const displayMyRooms = myRooms.length > 0 ? myRooms : rooms.slice(0, 2);
  
  if ((userLoading || isLoading) && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center space-y-4">
          <div className="h-20 w-20 bg-muted rounded-full mx-auto mb-4 relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
          <div className="h-6 w-40 bg-muted rounded mx-auto mb-2 relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
          <div className="h-4 w-60 bg-muted rounded mx-auto relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in bg-card p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="mb-6 text-muted-foreground">Please log in or register to view your profile</p>
          <div className="space-x-4">
            <Button variant="default" onClick={() => navigate('/auth')}>Log In</Button>
            <Button variant="outline" onClick={() => navigate('/auth', { state: { mode: 'register' } })}>Register</Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      {isEditing ? (
        // Edit Profile Form
        <div className="container max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username"
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Regular Profile View
        <>
          <ProfileHeader 
            avatarUrl={profile.avatar_url || avatarUrl}
            avatarBlobUrl={avatarBlobUrl}
            username={profile.username || ''}
            name={profile.name}
            bio={profile.bio}
            joinDate={profile.created_at}
            isLoading={isLoading}
            isCurrentUser={true}
            userId={profile.id}
            onRefreshAvatar={() => {
              if (profile?.id) {
                toast.info('Refreshing avatar...');
                
                // Clean up previous blob URL if exists
                if (avatarBlobUrl) {
                  URL.revokeObjectURL(avatarBlobUrl);
                  setAvatarBlobUrl(null);
                }
                
                // Directly fetch fresh avatar
                fetchAvatarAsBase64(profile.id).then(base64 => {
                  if (base64) setAvatarUrl(base64);
                });
                
                fetchUserAvatarBlob(profile.id);
                
                // Notify other components
                const refreshEvent = new CustomEvent('avatar-updated', { detail: { userId: profile.id } });
                window.dispatchEvent(refreshEvent);
              }
            }}
            onGenerateAvatar={() => setAvatarGeneratorOpen(true)}
            onEditProfile={handleEdit}
          />
          
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
              
              <TabsContent value="rooms" className="animate-fade-in space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : displayMyRooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayMyRooms.map((room) => (
                      <div key={room.id} className="animate-fade-in">
                        <RoomCard 
                          room={room} 
                          onClick={() => handleJoinRoom(room.id)} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't created or joined any rooms yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/create-room')}
                    >
                      Create Your First Room
                    </Button>
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
        </>
      )}
      
      {/* AI Avatar Generator Dialog */}
      <AIAvatarGenerator
        open={avatarGeneratorOpen}
        onOpenChange={setAvatarGeneratorOpen}
        onAvatarGenerated={handleAvatarUpdate}
        userId={profile.id}
      />
    </div>
  );
};

export default ProfilePage;
