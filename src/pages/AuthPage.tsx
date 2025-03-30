import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { 
  Mail, 
  Key, 
  UserPlus, 
  LogIn, 
  ArrowRight, 
  User, 
  Camera, 
  Loader2,
  AtSign,
  AlertCircle,
  Sparkles
} from "lucide-react";
import ParticleBackground from '@/components/ParticleBackground';
import Avatar from '@/components/Avatar';
import { Separator } from '@/components/ui/separator';
import AIAvatarGenerator from '@/components/AIAvatarGenerator';
import PlatformLogo from '@/components/PlatformLogo';

interface LocationState {
  from?: string;
}

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});
  
  const { isAuthenticated, login, register, loginWithGoogle } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [avatarGeneratorOpen, setAvatarGeneratorOpen] = useState(false);
  const [aiGeneratedAvatar, setAiGeneratedAvatar] = useState<string | null>(null);
  
  // Get the redirect path from location state
  const from = (location.state as LocationState)?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    
    return isValid;
  };

  const validatePassword = (password: string, isRegister = false): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    
    if (isRegister && password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const validateUsername = (username: string): boolean => {
    if (!username) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }
    
    if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, username: undefined }));
    return true;
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      if (!navigator.onLine) {
        toast({
          title: "Network error",
          description: "You appear to be offline. Please check your connection and try again.",
          variant: "destructive",
        });
        setGoogleLoading(false);
        return;
      }
      
      await loginWithGoogle();
      // No need to navigate here - the OAuth flow will redirect
    } catch (error: any) {
      // Handle specific error cases
      if (error.message === 'Failed to fetch' || error.code === 'NETWORK_ERROR') {
        toast({
          title: "Connection error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Failed to connect with Google",
          variant: "destructive",
        });
      }
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);
    try {
      if (!navigator.onLine) {
        toast({
          title: "Network error",
          description: "You appear to be offline. Please check your connection and try again.",
          variant: "destructive",
        });
        return;
      }
      
      await login(email, password);
      // Navigation will happen in the useEffect when isAuthenticated changes
    } catch (error: any) {
      // Handle specific error cases
      if (error.message === 'Failed to fetch' || error.code === 'NETWORK_ERROR') {
        toast({
          title: "Connection error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, true);
    const isUsernameValid = validateUsername(username);
    
    if (!isEmailValid || !isPasswordValid || !isUsernameValid) {
      return;
    }
    
    setLoading(true);
    try {
      if (!navigator.onLine) {
        toast({
          title: "Network error",
          description: "You appear to be offline. Please check your connection and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      await register(email, password, username, avatarFile || undefined);
      // Either redirected to verify email or auto-logged in
    } catch (error: any) {
      // Handle specific error cases
      if (error.message === 'Failed to fetch' || error.code === 'NETWORK_ERROR') {
        toast({
          title: "Connection error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else if (error.message.includes('already registered')) {
        toast({
          title: "Registration failed",
          description: "This email is already registered. Please try logging in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Please try again with a different email",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarGenerated = async (url: string) => {
    setAiGeneratedAvatar(url);
    
    // Create a file from the URL for registration
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      setAvatarFile(new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' }));
    } catch (error) {
      console.error('Error preparing avatar file:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ParticleBackground particleCount={20} />
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <PlatformLogo size="xl" />
            <h1 className="text-4xl font-bold gradient-purple mt-4">Vocalicious Vibe</h1>
          </div>
          <p className="text-muted-foreground">Join the conversation</p>
        </div>
        
        <div className="bg-card p-6 rounded-xl shadow-sm border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                      }}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value);
                      }}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.password && (
                      <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <LogIn className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-xs text-muted-foreground">
                    OR
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative cursor-pointer group" onClick={() => setAvatarGeneratorOpen(true)}>
                    {aiGeneratedAvatar ? (
                      <img 
                        src={aiGeneratedAvatar} 
                        alt="AI Generated avatar" 
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="cooluser"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        validateUsername(e.target.value);
                      }}
                      className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.username && (
                      <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {errors.username}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                      }}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value, true);
                      }}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.password && (
                      <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <UserPlus className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-xs text-muted-foreground">
                    OR
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
      
      <AIAvatarGenerator
        open={avatarGeneratorOpen}
        onOpenChange={setAvatarGeneratorOpen}
        onAvatarGenerated={handleAvatarGenerated}
        userId={`temp-${Date.now()}`}
      />
    </div>
  );
};

export default AuthPage;
