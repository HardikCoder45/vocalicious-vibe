import { toast } from "sonner";

// Define TypeScript interfaces for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

type TranscriptionMessage = {
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
};

type TranscriptionCallbacks = {
  onTranscription?: (message: TranscriptionMessage) => void;
  onError?: (error: string) => void;
};

let recognition: SpeechRecognition | null = null;
let callbacks: TranscriptionCallbacks = {};
let isListening = false;
let currentUserId: string | null = null;
let currentUsername: string | null = null;
let recognitionTimeout: NodeJS.Timeout | null = null;

// Initialize the Web Speech API
const initSpeechRecognition = () => {
  try {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Your browser doesn't support speech recognition");
      return false;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition not available");
      return false;
    }

    recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Default language
    
    // Set up event handlers
    recognition.onresult = handleTranscriptionResult;
    recognition.onerror = handleTranscriptionError;
    recognition.onend = handleTranscriptionEnd;
    
    return true;
  } catch (error) {
    console.error("Failed to initialize speech recognition:", error);
    toast.error("Failed to initialize live captions");
    return false;
  }
};

// Handle transcription results
const handleTranscriptionResult = (event: SpeechRecognitionEvent) => {
  if (!callbacks.onTranscription || !currentUserId || !currentUsername) return;
  
  try {
    const lastResult = event.results[event.results.length - 1];
    if (!lastResult) return;
    
    const transcript = lastResult[0]?.transcript || '';
    const isFinal = lastResult.isFinal;
    
    console.log(`Transcription received: "${transcript}" (${isFinal ? 'final' : 'interim'})`);
    
    callbacks.onTranscription({
      userId: currentUserId,
      username: currentUsername,
      text: transcript,
      timestamp: Date.now(),
      isFinal
    });
  } catch (error) {
    console.error("Error processing transcription result:", error);
  }
};

// Handle transcription errors
const handleTranscriptionError = (event: SpeechRecognitionErrorEvent) => {
  console.error("Transcription error:", event.error, event.message);
  
  if (callbacks.onError) {
    callbacks.onError(`Transcription error: ${event.error}`);
  }
  
  // Restart if it was running
  if (isListening) {
    restartTranscription();
  }
};

// Handle transcription ending
const handleTranscriptionEnd = () => {
  console.log("Transcription ended");
  
  // Restart if it was supposed to be listening
  if (isListening) {
    restartTranscription();
  }
};

// Restart transcription after errors or auto-stop
const restartTranscription = () => {
  if (recognition && isListening) {
    try {
      // Clear any existing timeout
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
      }
      
      recognitionTimeout = setTimeout(() => {
        console.log("Restarting transcription...");
        try {
          recognition?.start();
        } catch (error) {
          console.error("Failed to restart recognition:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error restarting transcription:", error);
    }
  }
};

// Start transcription
export const startTranscription = (
  userId: string, 
  username: string,
  callbacksArg?: TranscriptionCallbacks
): boolean => {
  if (!userId || !username) {
    console.error("User ID and username required for transcription");
    return false;
  }
  
  // Store user info and callbacks
  currentUserId = userId;
  currentUsername = username;
  
  if (callbacksArg) {
    callbacks = callbacksArg;
  }
  
  // Initialize if not already done
  if (!recognition) {
    const success = initSpeechRecognition();
    if (!success) return false;
  }
  
  // Start listening
  try {
    recognition?.stop(); // Stop any existing session first
    setTimeout(() => {
      try {
        recognition?.start();
        isListening = true;
        console.log("Transcription started");
      } catch (error) {
        console.error("Error starting transcription:", error);
        toast.error("Failed to start transcription");
      }
    }, 300);
    return true;
  } catch (error) {
    console.error("Error starting transcription:", error);
    toast.error("Failed to start transcription");
    return false;
  }
};

// Stop transcription
export const stopTranscription = () => {
  try {
    if (recognition) {
      recognition.stop();
      isListening = false;
      console.log("Transcription stopped");
      
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
      }
    }
  } catch (error) {
    console.error("Error stopping transcription:", error);
  }
};

// Check if transcription is active
export const isTranscribing = () => {
  return isListening;
};

// Set language for transcription
export const setTranscriptionLanguage = (langCode: string) => {
  if (recognition) {
    recognition.lang = langCode;
    
    // Restart if active
    if (isListening) {
      recognition.stop();
      setTimeout(() => recognition?.start(), 500);
    }
    
    return true;
  }
  return false;
};