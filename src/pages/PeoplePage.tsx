import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, UserCheck, UserMinus, CircleUser, RefreshCw } from "lucide-react";
import Avatar from '@/components/Avatar';
import ParticleBackground from '@/components/ParticleBackground';
import { supabase } from "@/integrations/supabase/client";
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import { fetchAvatarAsBase64 } from '@/utils/avatarUtils';

interface Person {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
  isOnline: boolean;
  avatarBase64?: string | null;
}

// Keep mock people for offline section
const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'Alex Johnson',
    username: 'alex_tech',
    avatar_url: null,
    bio: 'Tech enthusiast and AI researcher',
    isFollowing: true,
    isOnline: false,
  },
  {
    id: 'person-2',
    name: 'Sofia Chen',
    username: 'sofia_designs',
    avatar_url: null,
    bio: 'UX Designer | Creating user-centered experiences',
    isFollowing: false,
    isOnline: false,
  },
  {
    id: 'person-3',
    name: 'Marcus Lee',
    username: 'marcus_music',
    avatar_url: null,
    bio: 'Music producer and audio engineer',
    isFollowing: true,
    isOnline: false,
  },
  {
    id: 'person-4',
    name: 'Emma Wilson',
    username: 'emma_writes',
    avatar_url: null,
    bio: 'Author and storyteller',
    isFollowing: false,
    isOnline: false,
  },
  {
    id: 'person-5',
    name: 'Daniel Brown',
    username: 'dan_codes',
    avatar_url: null,
    bio: 'Fullstack developer | Open source contributor',
    isFollowing: false,
    isOnline: false,
  },
  {
    id: 'person-6',
    name: 'Olivia Martinez',
    username: 'olivia_art',
    avatar_url: null,
    bio: 'Digital artist and illustrator',
    isFollowing: true,
    isOnline: false,
  },
];

const PeoplePage = () => {
  const { profile } = useUser();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Function to handle fetching users
  const fetchUsers = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    // Start with mock data as fallback
    let combinedUsers: Person[] = [...mockPeople];
    
    try {
      console.log('Attempting to fetch users from Supabase...');
      
      // Use the correct table name: user_profiles (not profiles)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, username, avatar_url, bio');
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} users`);
        
        // Process real users (as online)
        const realUsers: Person[] = [];
        
        // Safe way to process users with proper type checking
        for (const user of data) {
          // Skip current user
          if (profile && user.id === profile.id) continue;
          
          realUsers.push({
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio,
            isFollowing: false,
            isOnline: true, // Real users shown as online
            avatarBase64: null // Will fetch separately
          });
        }
        
        // Set mock users as offline
        const offlineUsers = mockPeople.map(user => ({...user, isOnline: false}));
        
        // Combine both sets
        combinedUsers = [...realUsers, ...offlineUsers];
        
        // Fetch avatars in background (no await)
        for (const user of realUsers) {
          fetchAvatarForUser(user.id);
        }
      } else {
        console.log('No users found in database');
        toast.info('No users found. Showing sample data.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load users:', errorMessage);
      setLoadError(errorMessage);
      toast.error('Could not load users. Using sample data instead.');
    } finally {
      // Always update the state with whatever we have
      setPeople(combinedUsers);
      setFilteredPeople(combinedUsers);
      setIsLoading(false);
    }
  };
  
  // Type-safe avatar fetching function
  const fetchAvatarForUser = async (userId: string) => {
    try {
      const avatar = await fetchAvatarAsBase64(userId);
      if (avatar) {
        // Type-safe update
        setPeople(prevPeople => 
          prevPeople.map(person => 
            person.id === userId 
              ? {...person, avatarBase64: avatar} 
              : person
          )
        );
      }
    } catch (err) {
      console.error(`Failed to fetch avatar for user ${userId}:`, err);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [profile?.id]);
  
  // Filter people when search term or active tab changes
  useEffect(() => {
    let filtered = [...people];
    
    // First filter by tab
    if (activeTab === 'online') {
      filtered = filtered.filter(person => person.isOnline);
    } else if (activeTab === 'offline') {
      filtered = filtered.filter(person => !person.isOnline);
    }
    
    // Then filter by search term
    if (searchTerm.trim() !== '') {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(person => 
        (person.name?.toLowerCase().includes(lowerCaseSearch) || false) || 
        (person.username?.toLowerCase().includes(lowerCaseSearch) || false) ||
        (person.bio?.toLowerCase().includes(lowerCaseSearch) || false)
      );
    }
    
    setFilteredPeople(filtered);
  }, [searchTerm, people, activeTab]);
  
  // Toggle follow status
  const toggleFollow = (id: string) => {
    setPeople(prev => 
      prev.map(person => 
        person.id === id 
          ? { ...person, isFollowing: !person.isFollowing } 
          : person
      )
    );
  };
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 py-6 md:px-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold gradient-purple">People</h1>
          
          {loadError && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fetchUsers()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for people"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="online" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2">
              <UserMinus className="h-4 w-4" />
              Offline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      
      <main className="px-4 md:px-8 pb-8">
        <div className="animate-fade-in">
          {loadError && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-6">
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                Could not load all users. Showing sample data instead.
              </p>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            {activeTab === 'online' ? (
              <>
                <CircleUser className="mr-2 h-5 w-5 text-green-500" />
                Online Users
              </>
            ) : activeTab === 'offline' ? (
              <>
                <CircleUser className="mr-2 h-5 w-5 text-gray-400" />
                Offline Users
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                {searchTerm ? 'Search Results' : 'All Users'}
              </>
            )}
          </h2>
          
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center p-4 border rounded-lg bg-card">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : filteredPeople.length > 0 ? (
            <div className="space-y-4">
              {filteredPeople.map((person, index) => (
                <div 
                  key={person.id} 
                  className="flex items-center p-4 border rounded-lg bg-card animate-fade-in hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <Avatar 
                      src={person.avatarBase64 || person.avatar_url} 
                      alt={person.name || 'User'} 
                      size="sm" 
                      userId={person.id} 
                    />
                    {/* Online indicator */}
                    <span 
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${person.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{person.name || 'Unnamed User'}</h3>
                      {person.username && (
                        <span className="text-muted-foreground text-sm ml-2">@{person.username}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {person.bio || 'No bio available'}
                    </p>
                  </div>
                  
                  <Button
                    variant={person.isFollowing ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleFollow(person.id)}
                    className="min-w-[100px]"
                  >
                    {person.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground animate-fade-in">
              <Search className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">No people found</h3>
              <p>Try a different search term or filter</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PeoplePage;
