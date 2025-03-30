/**
 * Helper functions for handling browser permissions
 */

/**
 * Check if microphone permission is granted
 * @returns Promise resolving to permission state: 'granted', 'denied', or 'prompt'
 */
export async function checkMicrophonePermission(): Promise<PermissionState> {
  try {
    // Check if the Permissions API is supported
    if (navigator.permissions) {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state;
    }
    
    // Fallback for browsers that don't support the Permissions API
    try {
      // Try to get the stream - will throw if denied
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clean up the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return 'granted';
    } catch (error) {
      return 'denied';
    }
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return 'prompt'; // Assume we need to prompt if we can't determine permission
  }
}

/**
 * Request microphone permission from the user
 * @returns Promise resolving to true if granted, false if denied
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // Try to get user media with audio
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } 
    });
    
    // Clean up the stream immediately (we're just requesting permission)
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if the browser supports the required audio APIs
 * @returns Object with support status for different audio features
 */
export function checkAudioSupport(): {
  getUserMedia: boolean;
  audioContext: boolean;
  webRTC: boolean;
  fullSupport: boolean;
} {
  const getUserMediaSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const audioContextSupport = !!(window.AudioContext || (window as any).webkitAudioContext);
  const webRTCSupport = !!(window.RTCPeerConnection);
  
  return {
    getUserMedia: getUserMediaSupport,
    audioContext: audioContextSupport,
    webRTC: webRTCSupport,
    fullSupport: getUserMediaSupport && audioContextSupport && webRTCSupport
  };
}

/**
 * Show browser permission instructions based on the browser type
 * @returns Object with instructions and help links
 */
export function getMicrophonePermissionInstructions(): {
  browser: string;
  instructions: string;
  helpLink: string;
} {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detect browser
  if (userAgent.includes('chrome')) {
    return {
      browser: 'Chrome',
      instructions: 'Click the lock icon in the address bar and set "Microphone" to "Allow"',
      helpLink: 'https://support.google.com/chrome/answer/2693767'
    };
  } else if (userAgent.includes('firefox')) {
    return {
      browser: 'Firefox',
      instructions: 'Click the lock icon in the address bar and set "Use the Microphone" to "Allow"',
      helpLink: 'https://support.mozilla.org/kb/how-manage-your-camera-and-microphone-permissions'
    };
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return {
      browser: 'Safari',
      instructions: 'Go to Safari > Preferences > Websites > Microphone and allow this site',
      helpLink: 'https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac'
    };
  } else if (userAgent.includes('edg')) {
    return {
      browser: 'Edge',
      instructions: 'Click the lock icon in the address bar and set "Microphone" to "Allow"',
      helpLink: 'https://support.microsoft.com/microsoft-edge'
    };
  } else {
    return {
      browser: 'Your browser',
      instructions: 'Check your browser settings to allow microphone access for this site',
      helpLink: '#'
    };
  }
} 