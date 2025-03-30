import { supabase } from '@/integrations/supabase/client';
import * as audioStreamService from '@/services/audioStreamService';

export async function diagnoseDatabaseIssue() {
  try {
    console.log('Starting Supabase connection diagnosis...');
    
    // Check what client we're using
    console.log('Supabase client:', supabase);
    
    // Try a simple query to check if database is responsive
    console.log('Testing database connection...');
    const startTime = Date.now();
    const { data, error } = await supabase.from('rooms').select('count').limit(1);
    const endTime = Date.now();
    
    if (error) {
      console.error('Database query error:', error);
      return {
        success: false,
        error: error.message,
        details: error,
        responseTime: endTime - startTime
      };
    }
    
    console.log('Database responded in', endTime - startTime, 'ms');
    console.log('Query result:', data);
    
    // Try to get auth status
    const { data: authData } = await supabase.auth.getSession();
    console.log('Current auth session:', authData.session ? 'Authenticated' : 'Not authenticated');
    
    return {
      success: true,
      responseTime: endTime - startTime,
      authStatus: authData.session ? 'authenticated' : 'unauthenticated'
    };
  } catch (err) {
    console.error('Diagnosis failed with exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    };
  }
}

export async function diagnoseAudioConnectionIssue() {
  try {
    console.log('Starting audio connection diagnosis...');
    
    // Check the audio initialization
    const isInitialized = await audioStreamService.isInitialized();
    console.log('Audio system initialized:', isInitialized);
    
    // Check the connection status
    const connectionStatus = audioStreamService.getConnectionStatus();
    console.log('Audio connection status:', connectionStatus);
    
    // Get socket status if available
    const socket = audioStreamService.getSocket();
    const socketConnected = socket && socket.connected;
    console.log('WebSocket connected:', socketConnected);
    
    // Check for WebRTC support
    const rtcSupport = !!window.RTCPeerConnection;
    console.log('WebRTC supported:', rtcSupport);
    
    // Check for audio permissions
    let micPermission = 'unknown';
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      micPermission = permissionStatus.state;
      console.log('Microphone permission:', micPermission);
    } catch (e) {
      console.log('Unable to query microphone permission:', e);
    }
    
    // Run network diagnostics
    const networkInfo = await checkNetworkConnectivity();
    console.log('Network diagnostics:', networkInfo);
    
    // Test STUN server connectivity
    const stunConnectivity = await testStunConnectivity();
    console.log('STUN connectivity:', stunConnectivity);
    
    return {
      success: true,
      isInitialized,
      connectionStatus,
      socketConnected,
      rtcSupport,
      micPermission,
      network: networkInfo,
      stunConnectivity
    };
  } catch (err) {
    console.error('Audio diagnosis failed with exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    };
  }
}

// Helper to check basic network connectivity
async function checkNetworkConnectivity() {
  try {
    const online = navigator.onLine;
    console.log('Browser reports online:', online);
    
    // Try to ping a few reliable servers with fetch
    const serverUrls = [
      'https://www.google.com',
      'https://www.cloudflare.com',
      'https://www.amazon.com'
    ];
    
    const results = await Promise.allSettled(
      serverUrls.map(async url => {
        const startTime = Date.now();
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store'
        });
        const endTime = Date.now();
        return {
          url,
          success: true,
          time: endTime - startTime
        };
      })
    );
    
    const pingResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: serverUrls[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    return {
      online,
      pingResults
    };
  } catch (e) {
    return {
      online: navigator.onLine,
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
}

// Test STUN server connectivity
async function testStunConnectivity() {
  try {
    // Test common STUN servers
    const stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ];
    
    const results = await Promise.allSettled(
      stunServers.map(async server => {
        try {
          // Create a peer connection with this STUN server
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: server }]
          });
          
          // Create a data channel to trigger ICE candidate gathering
          pc.createDataChannel('test');
          
          // Create an offer to trigger connection attempt
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          // Wait for ICE gathering to complete or timeout
          let successful = false;
          const iceGatheringPromise = new Promise<boolean>(resolve => {
            const timeout = setTimeout(() => resolve(false), 5000);
            
            pc.addEventListener('icegatheringstatechange', () => {
              if (pc.iceGatheringState === 'complete') {
                clearTimeout(timeout);
                
                // Check if we got any candidates
                const candidates = pc.localDescription?.sdp?.match(/a=candidate/g)?.length || 0;
                resolve(candidates > 0);
              }
            });
          });
          
          successful = await iceGatheringPromise;
          pc.close();
          
          return {
            server,
            success: successful
          };
        } catch (e) {
          return {
            server,
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          };
        }
      })
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          server: stunServers[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  } catch (e) {
    return [{
      server: 'general',
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    }];
  }
}

// Full system diagnostic 
export async function diagnoseFullSystem() {
  try {
    console.log('Running full system diagnostic...');
    
    const dbDiagnosis = await diagnoseDatabaseIssue();
    const audioDiagnosis = await diagnoseAudioConnectionIssue();
    
    // Check browser compatibility
    const browser = {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language
    };
    
    // Get device info if available
    let deviceInfo = null;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      
      deviceInfo = {
        audioInputCount: audioInputs.length,
        audioOutputCount: audioOutputs.length,
        devices: devices.map(d => ({
          kind: d.kind,
          label: d.label || 'unnamed device', 
          id: d.deviceId.substring(0, 8) + '...' // Truncate for privacy
        }))
      };
    } catch (e) {
      deviceInfo = { error: e instanceof Error ? e.message : 'Unknown error' };
    }
    
    return {
      timestamp: new Date().toISOString(),
      database: dbDiagnosis,
      audio: audioDiagnosis,
      browser,
      deviceInfo,
      success: dbDiagnosis.success && audioDiagnosis.success
    };
  } catch (err) {
    console.error('Full system diagnosis failed:', err);
    return {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
      success: false
    };
  }
} 