
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import Avatar from '@/components/Avatar';
import ParticleBackground from '@/components/ParticleBackground';

interface Person {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
}

const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'Alex Johnson',
    username: 'alex_tech',
    avatar: '/placeholder.svg',
    bio: 'Tech enthusiast and AI researcher',
    isFollowing: true,
  },
  {
    id: 'person-2',
    name: 'Sofia Chen',
    username: 'sofia_designs',
    avatar: '/placeholder.svg',
    bio: 'UX Designer | Creating user-centered experiences',
    isFollowing: false,
  },
  {
    id: 'person-3',
    name: 'Marcus Lee',
    username: 'marcus_music',
    avatar: '/placeholder.svg',
    bio: 'Music producer and audio engineer',
    isFollowing: true,
  },
  {
    id: 'person-4',
    name: 'Emma Wilson',
    username: 'emma_writes',
    avatar: '/placeholder.svg',
    bio: 'Author and storyteller',
    isFollowing: false,
  },
  {
    id: 'person-5',
    name: 'Daniel Brown',
    username: 'dan_codes',
    avatar: '/placeholder.svg',
    bio: 'Fullstack developer | Open source contributor',
    isFollowing: false,
  },
  {
    id: 'person-6',
    name: 'Olivia Martinez',
    username: 'olivia_art',
    avatar: '/placeholder.svg',
    bio: 'Digital artist and illustrator',
    isFollowing: true,
  },
];

const PeoplePage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize with mock data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPeople(mockPeople);
      setFilteredPeople(mockPeople);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Filter people when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPeople(people);
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = people.filter(person => 
      person.name.toLowerCase().includes(lowerCaseSearch) || 
      person.username.toLowerCase().includes(lowerCaseSearch) ||
      person.bio.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredPeople(filtered);
  }, [searchTerm, people]);
  
  const toggleFollow = (id: string) => {
    setPeople(prev => 
      prev.map(person => 
        person.id === id 
          ? { ...person, isFollowing: !person.isFollowing } 
          : person
      )
    );
    
    setFilteredPeople(prev => 
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
        <h1 className="text-3xl font-bold gradient-purple mb-6">People</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for people"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </header>
      
      <main className="px-4 md:px-8 pb-8">
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {searchTerm ? 'Search Results' : 'Suggested People'}
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center p-4 border rounded-lg">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                    <div className="h-3 w-48 bg-muted rounded"></div>
                  </div>
                  <div className="h-9 w-24 bg-muted rounded"></div>
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
                  <Avatar src={person.avatar} alt={person.name} size="sm" />
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{person.name}</h3>
                      <span className="text-muted-foreground text-sm ml-2">@{person.username}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{person.bio}</p>
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
              <p>Try a different search term</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PeoplePage;
