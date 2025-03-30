import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mic, MicOff, ShieldCheck } from 'lucide-react';
import Avatar from '@/components/Avatar';

export interface Notification {
  id: string;
  type: 'userJoined' | 'userLeft' | 'speakerAdded' | 'speakerRemoved' | 'moderatorAction';
  userId: string;
  username: string;
  timestamp: number;
  message?: string;
}

interface RoomNotificationsProps {
  notifications: Notification[];
  maxNotifications?: number;
}

const RoomNotifications: React.FC<RoomNotificationsProps> = ({ 
  notifications, 
  maxNotifications = 3 
}) => {
  // Limit the number of notifications shown at once
  const visibleNotifications = notifications
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxNotifications);
  
  if (visibleNotifications.length === 0) return null;
  
  return (
    <div className="fixed top-20 right-4 z-30 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-card p-3 rounded-md shadow-md border flex items-center gap-2"
          >
            <div className="flex-shrink-0">
              {notification.type === 'userJoined' && (
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
              )}
              {notification.type === 'speakerAdded' && (
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <Mic className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
              )}
              {notification.type === 'speakerRemoved' && (
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <MicOff className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                </div>
              )}
              {notification.type === 'moderatorAction' && (
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
              )}
              {notification.type === 'userLeft' && (
                <Avatar
                  src={null}
                  alt={notification.username}
                  size="sm"
                  id={notification.userId}
                  userId={notification.userId}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {notification.type === 'userJoined' && `${notification.username} joined the room`}
                {notification.type === 'userLeft' && `${notification.username} left the room`}
                {notification.type === 'speakerAdded' && `${notification.username} is now a speaker`}
                {notification.type === 'speakerRemoved' && `${notification.username} is now a listener`}
                {notification.type === 'moderatorAction' && notification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(notification.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Format timestamp as "just now", "2m ago", etc.
const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 10000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  
  return `${Math.floor(diff / 3600000)}h ago`;
};

export default RoomNotifications; 