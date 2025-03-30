import { supabase } from "@/integrations/supabase/client";

// Cache for storing base64 avatar strings to avoid repeated fetches/conversions
interface AvatarCache {
  [userId: string]: {
    base64: string;
    timestamp: number;
  }
}

// In-memory cache that expires after 30 minutes
const avatarCache: AvatarCache = {};
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches user avatar from Supabase storage and converts it to base64
 * Uses a consistent path structure: avatars/userId/profile.png
 * 
 * @param userId The user ID to fetch the avatar for
 * @param forceRefresh Optional flag to force a refresh of the avatar
 * @returns A base64 string of the avatar image or null if not found
 */
export const fetchAvatarAsBase64 = async (userId: string) => {
  if (!userId) return null;
  
  try {
    // Fetch from storage directly
    const avatarPath = `avatars/${userId}/profile.png`;
    console.log('Fetching avatar from path:', avatarPath);
    
    const { data: fileData, error: fileError } = await supabase.storage
      .from('user-content')
      .download(avatarPath);
    
    if (fileError || !fileData) {
      // Try listing files in directory
      const { data: files, error: listError } = await supabase.storage
        .from('user-content')
        .list(`avatars/${userId}`);
      
      if (listError || !files || files.length === 0) {
        console.log('No avatar found for user');
        return null;
      }
      
      // Sort files and get the most recent one
      const sortedFiles = [...files].sort((a, b) => b.name.localeCompare(a.name));
      const fileName = sortedFiles[0].name;
      
      const { data: altFileData, error: altFileError } = await supabase.storage
        .from('user-content')
        .download(`avatars/${userId}/${fileName}`);
      
      if (altFileError || !altFileData) {
        console.error('Error downloading alternative file');
        return null;
      }
      
      // Convert blob to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(altFileData);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      });
    }
    
    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileData);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return null;
  }
};

/**
 * Updates the avatar cache directly with a new base64 string
 * Useful when a new avatar is uploaded and you want to update the cache
 * 
 * @param userId The user ID to update the cache for
 * @param base64 The base64 string to cache
 */
export const updateAvatarCache = (userId: string, base64: string): void => {
  if (!userId || !base64) return;
  
  avatarCache[userId] = {
    base64,
    timestamp: Date.now()
  };
};

/**
 * Clears the avatar cache for a specific user or all users
 * 
 * @param userId Optional user ID to clear cache for. If not provided, clears all cache.
 */
export const clearAvatarCache = (userId: string) => {
  console.log(`Avatar cache system disabled, no cache to clear for ${userId}`);
  // Function kept for API compatibility
};

/**
 * Prefetches avatars for a list of users and caches them
 * Useful for optimizing performance when displaying multiple avatars at once
 * 
 * @param userIds Array of user IDs to prefetch avatars for
 * @returns A map of userId to base64 avatar strings
 */
export const prefetchAvatars = async (userIds: string[]): Promise<Record<string, string>> => {
  if (!userIds || userIds.length === 0) return {};
  
  const uniqueIds = [...new Set(userIds)].filter(id => !!id);
  const result: Record<string, string> = {};
  
  // Process in batches of 5 to avoid too many concurrent requests
  const batchSize = 5;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    const promises = batch.map(async (userId) => {
      // Check cache first
      const cachedAvatar = avatarCache[userId];
      if (cachedAvatar && (Date.now() - cachedAvatar.timestamp < CACHE_EXPIRY)) {
        result[userId] = cachedAvatar.base64;
        return;
      }
      
      try {
        const avatarPath = `avatars/${userId}/profile.png`;
        const { data, error } = await supabase.storage
          .from('user-content')
          .download(avatarPath);
        
        if (error || !data) return;
        
        const base64 = await blobToBase64(data);
        
        // Cache the result
        avatarCache[userId] = {
          base64,
          timestamp: Date.now()
        };
        
        result[userId] = base64;
      } catch (error) {
        console.error(`Error prefetching avatar for user ${userId}:`, error);
      }
    });
    
    await Promise.all(promises);
  }
  
  return result;
};

/**
 * Converts a Blob to a base64 string
 * 
 * @param blob The blob to convert
 * @returns A Promise that resolves to the base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}; 