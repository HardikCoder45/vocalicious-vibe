
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, PlusCircle } from "lucide-react";
import { useRoom } from '@/context/RoomContext';
import { useUser } from '@/context/UserContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { createRoom, isLoading } = useRoom();
  const { isAuthenticated } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: 'General',
    color: 'from-purple-500 to-pink-500',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTopicChange = (value: string) => {
    setFormData(prev => ({ ...prev, topic: value }));
  };
  
  const handleColorChange = (value: string) => {
    setFormData(prev => ({ ...prev, color: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please provide a room name');
      return;
    }
    
    try {
      await createRoom({
        name: formData.name,
        description: formData.description,
        topic: formData.topic,
        color: formData.color,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    }
  };
  
  const colorOptions = [
    { value: 'from-purple-500 to-pink-500', label: 'Purple Haze' },
    { value: 'from-blue-500 to-teal-400', label: 'Ocean Blue' },
    { value: 'from-yellow-400 to-orange-500', label: 'Sunset' },
    { value: 'from-green-400 to-emerald-500', label: 'Emerald' },
    { value: 'from-indigo-500 to-purple-600', label: 'Deep Space' },
    { value: 'from-red-500 to-pink-600', label: 'Ruby' },
  ];
  
  const topicOptions = [
    'General', 'Technology', 'Business', 'Music', 'Art', 'Science',
    'Books', 'Travel', 'Sports', 'Gaming', 'Education', 'Health',
    'Politics', 'Food', 'Fashion', 'Movies', 'News'
  ];
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Create a Room</h1>
      </header>
      
      <main className="p-4 md:p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name*</Label>
            <Input
              id="name"
              name="name"
              placeholder="Give your room a name"
              value={formData.name}
              onChange={handleChange}
              required
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What will you talk about?"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select value={formData.topic} onValueChange={handleTopicChange}>
              <SelectTrigger id="topic" className="h-12">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {topicOptions.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Room Color</Label>
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className={`h-12 overflow-hidden ${
                    formData.color === option.value ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleColorChange(option.value)}
                >
                  <div className={`absolute inset-1 rounded bg-gradient-to-r ${option.value}`} />
                  <span className="sr-only">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Start Room"}
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateRoomPage;
