"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Wand2, RefreshCw, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react'
import { updateAvatarCache } from '@/utils/avatarUtils';

// AI avatar generation styles
const AVATAR_STYLES = [
  { name: "Realistic", value: "realistic photo" },
  { name: "Anime", value: "anime style" },
  { name: "3D Render", value: "3d rendered character" },
  { name: "Cartoon", value: "cartoon style" },
  { name: "Pixel Art", value: "pixel art style" },
  { name: "Watercolor", value: "watercolor painting" },
  { name: "Oil Painting", value: "oil painting style" }
];

// Platform logo URL
const PLATFORM_LOGO = "https://i.ibb.co/zVmwh8vy/Chat-GPT-Image-Mar-29-2025-12-54-14-PM-removebg-preview-1-removebg.png";

interface AIAvatarGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarGenerated: (url: string) => Promise<void>;
  userId: string;
}

const AIAvatarGenerator: React.FC<AIAvatarGeneratorProps> = ({ 
  open, 
  onOpenChange, 
  onAvatarGenerated,
  userId
}) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0].value);
  const [detailLevel, setDetailLevel] = useState(50);
  
  // Function to query the Hugging Face API
  const generateAvatar = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your avatar');
      return;
    }
    
    setGenerating(true);
    setGeneratedAvatar(null);
    
    try {
      // Build enhanced prompt with style and detail level
      const enhancedPrompt = `Professional avatar of ${prompt}, ${selectedStyle}, high quality, detailed facial features, centered composition, clean background, ${detailLevel}% detail level`;
      
      // Call the Hugging Face API
      const result = await query({ inputs: enhancedPrompt });
      
      // Create object URL from blob
      const imageUrl = URL.createObjectURL(result);
      setGeneratedAvatar(imageUrl);
      
      toast.success('Avatar generated successfully!');
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast.error('Failed to generate avatar. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const saveAvatar = async () => {
    if (!generatedAvatar) return;
    
    setPreviewLoading(true);
    try {
      // Convert blob URL to file
      const response = await fetch(generatedAvatar);
      const blob = await response.blob();
      
      // Create a timestamp to ensure uniqueness
      const timestamp = Date.now();
      const file = new File([blob], `avatar_${timestamp}.png`, { type: 'image/png' });
      
      // Use a consistent file path pattern with user ID
      const filePath = `avatars/${userId}/profile.png`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'image/png',
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
        
      // Store both the public URL and the storage path
      // This helps with future fetching directly from storage
      const avatarData = {
        avatar_url: data.publicUrl,
        avatar_path: filePath
      };
      
      // Convert blob to base64 for caching
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
      });
      
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;
      
      // Update avatar cache with the base64 version
      if (userId) {
        updateAvatarCache(userId, base64);
      }
      
      // Call the callback to update profile avatar_url
      await onAvatarGenerated(data.publicUrl);
      
      // Directly update the user_profiles table with both URL and path
      if (userId && userId.length > 5 && !userId.startsWith('temp-')) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(avatarData)
          .eq('id', userId);
          
        if (updateError) {
          console.warn('Profile update with avatar data failed:', updateError);
          // Continue anyway since we're using the callback too
        }
      }
      
      // Close dialog after successful upload
      onOpenChange(false);
      
      toast.success('AI-generated avatar saved successfully!');
    } catch (error: any) {
      console.error('Avatar save error:', error);
      toast.error('Failed to save avatar: ' + (error.message || 'Unknown error'));
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Function to query Hugging Face
  const query = async (data: { inputs: string }) => {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: data.inputs,
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.blob();
    return result;
  };
  
  const handleReset = () => {
    setGeneratedAvatar(null);
    setPrompt('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          {/* Platform logo added at top of dialog */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img 
              src={PLATFORM_LOGO} 
              alt="Vocalicious Vibe Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <div className="pt-8">
            <DialogTitle className="flex items-center justify-center gap-2 mt-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Avatar Generator
          </DialogTitle>
            <DialogDescription className="text-center">
            Create a unique AI-generated avatar based on your description
          </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {generatedAvatar ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-primary mx-auto">
                <img 
                  src={generatedAvatar} 
                  alt="Generated avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Different Prompt
                </Button>
                
                <Button 
                  variant="default" 
                  onClick={saveAvatar}
                  className="flex items-center gap-2"
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Use This Avatar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe how you want your avatar to look (e.g., 'a person with blue eyes and blonde hair wearing a suit')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  disabled={generating}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <Button 
                      key={style.value}
                      type="button"
                      size="sm"
                      variant={selectedStyle === style.value ? "default" : "outline"}
                      onClick={() => setSelectedStyle(style.value)}
                      className="text-xs"
                      disabled={generating}
                    >
                      {style.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Detail Level</label>
                  <span className="text-xs text-muted-foreground">{detailLevel}%</span>
                </div>
                <Slider
                  value={[detailLevel]}
                  min={25}
                  max={100}
                  step={5}
                  onValueChange={(values) => setDetailLevel(values[0])}
                  disabled={generating}
                />
              </div>
              
              <Button
                onClick={generateAvatar}
                className="w-full flex items-center justify-center gap-2 mt-2"
                disabled={generating || !prompt.trim()}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Avatar
                  </>
                )}
              </Button>
              
              {/* Platform logo/branding at bottom of form */}
              <div className="flex justify-center items-center mt-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Powered by</span>
                  <img 
                    src={PLATFORM_LOGO} 
                    alt="Vocalicious Vibe" 
                    className="h-5 w-5 object-contain"
                  />
                  <span>Vocalicious Vibe</span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAvatarGenerator;