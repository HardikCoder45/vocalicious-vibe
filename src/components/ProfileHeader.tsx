import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sparkles, Users, Edit, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  avatarUrl: string | null;
  avatarBlobUrl?: string | null;
  username: string;
  name?: string | null;
  bio?: string | null;
  joinDate?: string | null;
  isLoading?: boolean;
  isCurrentUser?: boolean;
  onRefreshAvatar?: () => void;
  onGenerateAvatar?: () => void;
  onEditProfile?: () => void;
  userId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  avatarUrl,
  avatarBlobUrl,
  username,
  name,
  bio,
  joinDate,
  isLoading = false,
  isCurrentUser = false,
  onRefreshAvatar,
  onGenerateAvatar,
  onEditProfile,
  userId,
}) => {
  // Format join date
  const formattedJoinDate = joinDate ? new Date(joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  if (isLoading) {
    return (
      <div className="px-4 pt-8 pb-6 md:px-8 text-center overflow-hidden">
        <div className="animate-pulse text-center space-y-4">
          <div className="h-24 w-24 bg-muted rounded-full mx-auto mb-4 relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
          <div className="h-6 w-40 bg-muted rounded mx-auto mb-2 relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
          <div className="h-4 w-60 bg-muted rounded mx-auto relative overflow-hidden">
            <div className="absolute inset-0 animate-skeleton-wave bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.header 
      className="px-4 pt-8 pb-6 md:px-8 text-center relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div 
        className="mb-6 relative inline-block group"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Avatar 
          src={avatarBlobUrl || avatarUrl} 
          alt={name || username} 
          size="xl"
          userId={userId}
        />
        
        {isCurrentUser && (
          <motion.div 
            className="absolute bottom-0 right-0 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={onRefreshAvatar}
              title="Refresh avatar"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={onGenerateAvatar}
              title="Generate new AI avatar"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold">{name || username}</h1>
        
        <div className="flex items-center justify-center mt-1">
          <Badge variant="outline" className="text-sm bg-background/50 backdrop-blur-sm">
            @{username}
          </Badge>
        </div>
        
        {bio && (
          <motion.p 
            className="mt-3 text-muted-foreground max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {bio}
          </motion.p>
        )}
        
        {formattedJoinDate && (
          <motion.div 
            className="mt-3 flex items-center justify-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Clock className="h-3 w-3 mr-1" />
            Joined {formattedJoinDate}
          </motion.div>
        )}
        
        {isCurrentUser && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditProfile}
              className="gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit Profile
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.header>
  );
};

export default ProfileHeader; 