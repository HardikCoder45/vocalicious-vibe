import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CaptionMessage = {
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  id?: string;
};

interface LiveCaptionsProps {
  messages: CaptionMessage[];
  isEnabled: boolean;
  onToggle: () => void;
}

const LiveCaptions: React.FC<LiveCaptionsProps> = ({ 
  messages, 
  isEnabled,
  onToggle 
}) => {
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current && !minimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);
  
  // Filter to only show most recent 5 messages when visible
  const visibleMessages = messages
    .filter(msg => msg.isFinal)
    .slice(-5);
  
  // Current non-final message to show at the bottom
  const currentInterimMessage = messages.find(msg => !msg.isFinal);
  
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-20 md:right-auto md:w-96 z-20">
      <AnimatePresence>
        {isEnabled && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden max-h-80"
          >
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Live Captions
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setMinimized(true)}
                >
                  <span className="sr-only">Minimize</span>
                  <span aria-hidden>−</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={onToggle}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 overflow-y-auto max-h-64">
              {visibleMessages.length === 0 && !currentInterimMessage ? (
                <p className="text-muted-foreground text-center py-8">
                  When someone speaks, captions will appear here
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleMessages.map((message) => (
                      <div key={`${message.userId}-${message.timestamp}`} className="space-y-1">
                        <p className="font-semibold text-sm">
                          {message.username}
                        </p>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  {currentInterimMessage && (
                    <div className="mt-3 border-t pt-3">
                      <p className="font-semibold text-sm">
                        {currentInterimMessage.username}
                      </p>
                      <p className="text-sm opacity-80 italic">
                        {currentInterimMessage.text}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isEnabled && minimized && (
        <Button
          variant="outline"
          className="absolute bottom-0 left-0 bg-background shadow-md"
          onClick={() => setMinimized(false)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Show Captions
        </Button>
      )}
      
      {!isEnabled && (
        <Button
          variant="outline"
          className="absolute bottom-0 left-0 bg-background shadow-md"
          onClick={onToggle}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Enable Captions
        </Button>
      )}
    </div>
  );
};

export default LiveCaptions;