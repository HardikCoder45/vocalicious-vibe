
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Sun, Moon, BellRing, Volume2, Shield, Key, HelpCircle, LogOut } from "lucide-react";
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { toast } from "sonner";
import ThemeSelector from '@/components/ThemeSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';

const SettingsPage = () => {
  const { theme } = useTheme();
  const { logout } = useUser();
  
  const handleToggle = (setting: string) => {
    toast(`${setting} setting updated`);
  };
  
  return (
    <div className="min-h-screen w-full pb-16 md:pl-16 md:pb-0">
      <ParticleBackground particleCount={30} />
      
      <header className="px-4 py-6 md:px-8 animate-fade-in">
        <div className="flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>
      
      <main className="px-4 md:px-8 pb-8 max-w-3xl">
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sun className="h-5 w-5 mr-2" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize how Vibe looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for a better experience at night
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                onCheckedChange={() => handleToggle('Dark mode')}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <Label className="font-medium mb-2 block">Theme Color</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a theme that matches your style
              </p>
              <div className="flex items-center gap-4">
                <ThemeSelector />
                <p className="text-sm font-medium capitalize">
                  Current: {theme === 'default' ? 'Purple' : theme}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellRing className="h-5 w-5 mr-2" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-rooms" className="font-medium">New Rooms</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when people you follow start a room
                </p>
              </div>
              <Switch 
                id="new-rooms" 
                defaultChecked 
                onCheckedChange={() => handleToggle('New rooms')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentions" className="font-medium">Mentions</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone mentions you
                </p>
              </div>
              <Switch 
                id="mentions" 
                defaultChecked 
                onCheckedChange={() => handleToggle('Mentions')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-followers" className="font-medium">New Followers</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone follows you
                </p>
              </div>
              <Switch 
                id="new-followers" 
                defaultChecked 
                onCheckedChange={() => handleToggle('New followers')}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="h-5 w-5 mr-2" />
              <span>Audio & Voice</span>
            </CardTitle>
            <CardDescription>
              Adjust your audio settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enhance-voice" className="font-medium">Enhance Voice</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically enhance your voice quality in rooms
                </p>
              </div>
              <Switch 
                id="enhance-voice" 
                defaultChecked
                onCheckedChange={() => handleToggle('Enhance voice')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="noise-cancellation" className="font-medium">Noise Cancellation</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce background noise when speaking
                </p>
              </div>
              <Switch 
                id="noise-cancellation" 
                defaultChecked
                onCheckedChange={() => handleToggle('Noise cancellation')}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              <span>Privacy & Security</span>
            </CardTitle>
            <CardDescription>
              Manage your privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-online" className="font-medium">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see when you're active
                </p>
              </div>
              <Switch 
                id="show-online" 
                defaultChecked
                onCheckedChange={() => handleToggle('Online status')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="private-profile" className="font-medium">Private Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow followers to see your profile
                </p>
              </div>
              <Switch 
                id="private-profile"
                onCheckedChange={() => handleToggle('Private profile')}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => toast.info('Password change dialog would open here')}
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>
        
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => toast.info('Help center would open here')}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Center
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
