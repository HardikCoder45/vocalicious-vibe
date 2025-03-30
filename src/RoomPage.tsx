// Handle speaker request
const handleRequestToSpeak = () => {
  if (currentUser && currentRoom) {
    // If already a speaker, stop speaking
    if (isUserSpeakerInRoom) {
      console.log("User is already a speaker, stopping speaking");
      toggleSpeaking(currentUser.id);
      return;
    }
    
    // If user is moderator, they can start speaking immediately
    if (isUserModeratorInRoom) {
      console.log("User is a moderator, starting speaking directly");
      toggleSpeaking(currentUser.id);
      return;
    }
    
    console.log("User is requesting to speak");
    
    // Find moderators in the room
    const moderatorsInRoom = currentRoom.speakers.filter(speaker => speaker.isModerator);
    
    if (moderatorsInRoom.length === 0) {
      toast.error("No moderators available to approve your request");
      return;
    }
    
    // Use the improved audioStreamService to request to speak
    try {
      const username = (currentUser as any).username || 
                       (currentUser as any).name || 
                       currentUser.email?.split('@')[0] || 
                       'Anonymous';
      
      const success = audioStreamService.requestToSpeak(
        currentRoom.id,
        currentUser.id,
        username
      );
      
      if (success) {
        toast.success("Request to speak sent to moderators");
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Error sending speak request:", error);
      toast.error("Could not send speak request due to a connection issue");
    }
  }
}; 