import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, Calendar, PlusCircle, Loader2, Info, X, Check, Sparkles } from "lucide-react";
import { useRoom } from '@/context/RoomContext';
import { useUser } from '@/context/UserContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Avatar from '@/components/Avatar';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { diagnoseDatabaseIssue } from '@/utils/supabaseDebug';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { createRoom, isLoading } = useRoom();
  const { isAuthenticated, profile } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: 'General',
    color: 'from-purple-500 to-pink-500',
    isScheduled: false,
    scheduledDate: new Date(),
    scheduledTime: '12:00',
    isPrivate: false,
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }>({});
  
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/create-room' } });
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleTopicChange = (value: string) => {
    setFormData(prev => ({ ...prev, topic: value }));
  };
  
  const handleColorChange = (value: string) => {
    setFormData(prev => ({ ...prev, color: value }));
    // Flash confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 800);
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, scheduledDate: date }));
      // Clear error when date is changed
      if (errors.scheduledDate) {
        setErrors(prev => ({ ...prev, scheduledDate: undefined }));
      }
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, scheduledTime: e.target.value }));
    // Clear error when time is changed
    if (errors.scheduledTime) {
      setErrors(prev => ({ ...prev, scheduledTime: undefined }));
    }
  };
  
  const handleScheduleToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isScheduled: checked }));
  };
  
  const handlePrivateToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate: checked }));
  };
  
  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      scheduledDate?: string;
      scheduledTime?: string;
    } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Room name must be less than 50 characters';
    }
    
    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }
    
    if (formData.isScheduled) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(formData.scheduledDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Date cannot be in the past';
      }
      
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'Time is required for scheduled rooms';
      } else {
        // Check if the selected time is in the past for today
        const now = new Date();
        const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
        const selectedDateTime = new Date(formData.scheduledDate);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        
        if (selectedDate.getTime() === today.getTime() && selectedDateTime < now) {
          newErrors.scheduledTime = 'Time cannot be in the past';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // If form has errors, highlight the error fields and show an alert
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      // First, diagnose any potential database issues
      console.log('Checking database connection...');
      const diagnosis = await diagnoseDatabaseIssue();
      console.log('Database diagnosis result:', diagnosis);
      
      if (!diagnosis.success) {
        toast.error('Database connection issue detected', {
          description: 'Please check your internet connection and try again'
        });
        return;
      }
      
      let scheduledFor = undefined;
      
      if (formData.isScheduled) {
        const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(formData.scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        scheduledFor = scheduledDateTime.toISOString();
      }
      
      // Make sure all required fields have values - use defaults if needed
      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim() || 'Join the conversation',
        topic: formData.topic || 'General',
        color: formData.color || 'from-purple-500 to-pink-500',
        scheduled_for: scheduledFor,
        // Room privacy will be implemented in the future
        isPrivate: formData.isPrivate,
      };
      
      console.log('Creating room with data:', roomData);
      
      const roomId = await createRoom(roomData);
      
      if (!roomId) {
        console.error('No room ID returned from createRoom');
        throw new Error('Failed to create room - no room ID returned');
      }
      
      console.log('Room created successfully with ID:', roomId);
      
      // Show success message
      toast.success(formData.isScheduled ? 
        'Room scheduled successfully!' : 
        'Room created successfully!', 
        { 
          description: formData.isScheduled ? 
            'Your room has been scheduled and will be visible in the upcoming rooms section.' :
            'Your room is now live and ready for participants to join.'
        }
      );
      
      // Navigate to the appropriate page based on if it's scheduled or live
      if (formData.isScheduled) {
        navigate('/'); // Go to home page to see upcoming rooms
      } else {
        navigate(`/room/${roomId}`); // Go directly to the new room
      }
    } catch (error: any) {
      console.error('Room creation error:', error);
      toast.error(error.message || 'Failed to create room. Please try again.');
    }
  };
  
  const colorOptions = [
    { value: 'from-purple-500 to-pink-500', label: 'Purple Haze' },
    { value: 'from-blue-500 to-teal-400', label: 'Ocean Blue' },
    { value: 'from-yellow-400 to-orange-500', label: 'Sunset' },
    { value: 'from-green-400 to-emerald-500', label: 'Emerald' },
    { value: 'from-indigo-500 to-purple-600', label: 'Deep Space' },
    { value: 'from-red-500 to-pink-600', label: 'Ruby' },
    { value: 'from-pink-400 to-pink-600', label: 'Pink Passion' },
    { value: 'from-emerald-400 to-blue-500', label: 'Aquamarine' },
    { value: 'from-orange-400 to-red-500', label: 'Volcano' },
  ];
  
  const topicOptions = [
    'General', 'Technology', 'Business', 'Music', 'Art', 'Science',
    'Books', 'Travel', 'Sports', 'Gaming', 'Education', 'Health',
    'Politics', 'Food', 'Fashion', 'Movies', 'News', 'Languages',
    'Photography', 'Design', 'Startups', 'Finance', 'Wellness',
    'Culture', 'Environment', 'Podcast', 'Self-Improvement'
  ];
  
  return (
    <div className="min-h-screen w-full pb-16 md:pb-0 bg-gradient-to-b from-background to-background/80">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between animate-fade-in">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Create a Room</h1>
        </div>
        
        <Button 
          type="submit" 
          onClick={handleSubmit}
          className="gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {formData.isScheduled ? 'Scheduling...' : 'Creating...'}
            </>
          ) : (
            <>
              {formData.isScheduled ? 'Schedule Room' : 'Create Room'}
              {formData.isScheduled ? <Calendar className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </>
          )}
        </Button>
      </header>
      
      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {formData.isScheduled ? 'Schedule a New Room' : 'Create a New Room'}
          </h2>
          <p className="text-muted-foreground">
            {formData.isScheduled 
              ? 'Plan your conversation for later and invite others to join.' 
              : 'Start a conversation now and invite others to join.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <Tabs defaultValue="basic" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="advanced">Additional Options</TabsTrigger>
                </TabsList>
                
                <CardContent className="p-6">
                  <TabsContent value="basic" className="mt-4 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name" className="text-base">Room Name*</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.name.length}/50
                        </span>
                      </div>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Give your room a descriptive name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`h-12 text-base ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description" className="text-base">Description</Label>
                        <span className={`text-xs ${formData.description.length > 180 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {formData.description.length}/200
                        </span>
                      </div>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="What will you talk about? Be specific to attract the right audience."
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className={`text-base ${errors.description ? 'border-destructive' : ''}`}
                      />
                      {errors.description && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="topic" className="text-base">Topic</Label>
                      <Select value={formData.topic} onValueChange={handleTopicChange}>
                        <SelectTrigger id="topic" className="h-12 text-base">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {topicOptions.sort().map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-base">Room Theme</Label>
                      <div className="grid grid-cols-3 gap-3 relative">
                        {colorOptions.map((option) => (
                          <TooltipProvider key={option.value} delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={`h-16 overflow-hidden transition-all duration-300 ${
                                    formData.color === option.value ? 'ring-2 ring-primary scale-105' : ''
                                  }`}
                                  onClick={() => handleColorChange(option.value)}
                                >
                                  <div className={`absolute inset-1 rounded bg-gradient-to-r ${option.value}`} />
                                  {formData.color === option.value && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-sm">
                                      <Check className="h-6 w-6 text-white drop-shadow-md" />
                                    </div>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>{option.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        
                        {showConfetti && (
                          <div className="absolute inset-0 pointer-events-none">
                            <Sparkles className="h-8 w-8 text-primary absolute animate-bounce" style={{ top: '30%', left: '20%' }} />
                            <Sparkles className="h-6 w-6 text-secondary absolute animate-bounce" style={{ top: '10%', left: '60%', animationDelay: '0.2s' }} />
                            <Sparkles className="h-7 w-7 text-primary absolute animate-bounce" style={{ top: '60%', right: '30%', animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="isScheduled" className="font-medium">Schedule for later</Label>
                        </div>
                        <Switch 
                          id="isScheduled" 
                          checked={formData.isScheduled}
                          onCheckedChange={handleScheduleToggle}
                        />
                      </div>
                      
                      {formData.isScheduled && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left h-12 ${errors.scheduledDate ? 'border-destructive' : ''}`}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {format(formData.scheduledDate, 'PPP')}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={formData.scheduledDate}
                                  onSelect={handleDateChange}
                                  disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {errors.scheduledDate && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.scheduledDate}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scheduledTime">Time</Label>
                            <Input
                              id="scheduledTime"
                              type="time"
                              value={formData.scheduledTime}
                              onChange={handleTimeChange}
                              className={`h-12 ${errors.scheduledTime ? 'border-destructive' : ''}`}
                            />
                            {errors.scheduledTime && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.scheduledTime}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setActiveTab('advanced')}
                        className="gap-2"
                      >
                        Next
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="mt-4 space-y-6">
                    <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="isPrivate" className="font-medium">Private Room</Label>
                        </div>
                        <Switch 
                          id="isPrivate" 
                          checked={formData.isPrivate}
                          onCheckedChange={handlePrivateToggle}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground pl-7">
                        {formData.isPrivate 
                          ? 'Only people with the link can join this room.' 
                          : 'Anyone can discover and join this room.'}
                      </p>
                    </div>
                    
                    <Alert className="bg-muted/30 border-muted">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Coming Soon</AlertTitle>
                      <AlertDescription>
                        More room settings like co-hosts, recording options, and participant controls will be available soon.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setActiveTab('basic')}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      
                      <Button 
                        type="submit"
                        onClick={handleSubmit}
                        className="gap-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {formData.isScheduled ? 'Scheduling...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            {formData.isScheduled ? 'Schedule Room' : 'Create Room'}
                            {formData.isScheduled ? <Calendar className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
          
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h2 className="text-lg font-medium mb-4">Room Preview</h2>
              <Card className="overflow-hidden">
                <div className={`h-20 bg-gradient-to-r ${formData.color} opacity-90`}></div>
                <CardContent className="p-4 -mt-6 relative">
                  <div className="bg-background rounded-lg p-4 shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {formData.name || 'Your Room Name'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{formData.topic}</Badge>
                          <span className="text-xs text-muted-foreground">0 listening</span>
                        </div>
                      </div>
                      <Badge 
                        variant={formData.isScheduled ? "secondary" : "destructive"} 
                        className={formData.isScheduled ? "" : "animate-pulse"}
                        style={{fontWeight: "500", textTransform: "uppercase"}}
                      >
                        {formData.isScheduled ? 'Scheduled' : 'Live'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {formData.description || 'Your room description will appear here'}
                    </p>
                    
                    {formData.isScheduled && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(formData.scheduledDate, 'PPP')} at {formData.scheduledTime}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Avatar 
                        src={profile?.avatar_url}
                        alt={profile?.name || profile?.username || 'You'} 
                        size="sm" 
                        className="h-8 w-8"
                        userId={profile?.id}
                      />
                      <div className="text-sm font-medium">
                        {profile?.name || profile?.username || 'You'} <span className="text-muted-foreground">(Host)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 text-sm space-y-4">
                <h3 className="font-medium text-foreground">Tips for a Great Room:</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Choose a specific, descriptive name to attract the right audience</li>
                  <li>Add a detailed description of what you'll be discussing</li>
                  <li>Select a topic that best matches your conversation</li>
                  <li>{formData.isScheduled ? 'Schedule at a time when your audience is likely to be available' : 'As the host, you\'ll have moderation controls for the room'}</li>
                  <li>Prepare some opening points to get the conversation flowing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateRoomPage;
