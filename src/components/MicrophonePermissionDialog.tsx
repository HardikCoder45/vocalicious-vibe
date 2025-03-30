import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mic, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getMicrophonePermissionInstructions, requestMicrophonePermission } from '@/lib/permissionsHelper';
import { toast } from 'sonner';

interface MicrophonePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
}

const MicrophonePermissionDialog: React.FC<MicrophonePermissionDialogProps> = ({
  open,
  onOpenChange,
  onPermissionGranted
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isGranted, setIsGranted] = useState(false);
  const { browser, instructions, helpLink } = getMicrophonePermissionInstructions();
  
  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await requestMicrophonePermission();
      
      if (granted) {
        setIsGranted(true);
        toast.success('Microphone access granted!');
        
        // Allow time for user to see success state
        setTimeout(() => {
          if (onPermissionGranted) {
            onPermissionGranted();
          }
          onOpenChange(false);
        }, 1500);
      } else {
        toast.error('Microphone access denied');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      toast.error('An error occurred while requesting microphone access');
    } finally {
      setIsRequesting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Microphone Access Required
          </DialogTitle>
          <DialogDescription>
            We need access to your microphone to enable voice chat features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isGranted ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Permission Granted!</h3>
                <p className="text-sm text-muted-foreground">
                  Your microphone is now connected and ready to use.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border rounded-md bg-muted/50">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Instructions for {browser}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{instructions}</p>
                <a 
                  href={helpLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  More help
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">How it works:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Click the button below to request microphone access</li>
                  <li>A permission prompt will appear in your browser</li>
                  <li>Select "Allow" to grant access</li>
                  <li>Your microphone will only be used when you're in a voice room</li>
                </ul>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          {!isGranted && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRequestPermission} 
                disabled={isRequesting}
                className="gap-2"
              >
                {isRequesting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Request Access
                  </>
                )}
              </Button>
            </>
          )}
          
          {isGranted && (
            <Button onClick={() => onOpenChange(false)}>
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MicrophonePermissionDialog; 