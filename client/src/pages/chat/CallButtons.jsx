import { FaPhone, FaVideo } from 'react-icons/fa';
import './CallButtons.css';
import { useState } from 'react';
import { toast } from 'sonner'; // Import toast if available
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CallButtons = ({ recipientId, onCall, disabled }) => {
  const [isCallAttempting, setIsCallAttempting] = useState(false);
  const [videoTooltipOpen, setVideoTooltipOpen] = useState(false);
  const [voiceTooltipOpen, setVoiceTooltipOpen] = useState(false);
  
  const startVoiceCall = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCallAttempting || disabled) {
      setVoiceTooltipOpen(true);
      setTimeout(() => setVoiceTooltipOpen(false), 2000);
      return;
    }
    
    try {
      setIsCallAttempting(true);
      
      // Call the callback if provided
      onCall && onCall();
      
      // Use the global function rather than DOM element
      if (window.callHandlerFunctions?.initiateCall) {
        window.callHandlerFunctions.initiateCall(recipientId, false);
      } else {
        console.error('Call handler function not available');
        toast?.error("Call service is not available right now");
      }
    } catch (error) {
      console.error("Error starting voice call:", error);
      toast?.error("Failed to start call. Please try again.");
    } finally {
      setTimeout(() => setIsCallAttempting(false), 1000);
    }
  };
  
  const startVideoCall = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCallAttempting || disabled) {
      setVideoTooltipOpen(true);
      setTimeout(() => setVideoTooltipOpen(false), 2000);
      return;
    }
    
    try {
      setIsCallAttempting(true);
      
      // Call the callback if provided
      onCall && onCall();
      
      // Use the global function rather than DOM element
      if (window.callHandlerFunctions?.initiateCall) {
        window.callHandlerFunctions.initiateCall(recipientId, true);
      } else {
        console.error('Call handler function not available');
        toast?.error("Call service is not available right now");
      }
    } catch (error) {
      console.error("Error starting video call:", error);
      toast?.error("Failed to start call. Please try again.");
    } finally {
      setTimeout(() => setIsCallAttempting(false), 1000);
    }
  };
  
  return (
    <div className="call-buttons">
      <TooltipProvider>
        <Tooltip open={videoTooltipOpen} onOpenChange={setVideoTooltipOpen}>
          <TooltipTrigger asChild>
      <button 
              className={`call-button video ${isCallAttempting || disabled ? 'disabled' : ''}`}
        onClick={startVideoCall}
        aria-label="Video call"
              disabled={isCallAttempting || disabled}
      >
        <FaVideo />
      </button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white rounded-[6px] p-2">
            {disabled ? "Group calls coming soon!" : "Video call"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip open={voiceTooltipOpen} onOpenChange={setVoiceTooltipOpen}>
          <TooltipTrigger asChild>
      <button 
              className={`call-button voice ${isCallAttempting || disabled ? 'disabled' : ''}`}
        onClick={startVoiceCall}
        aria-label="Voice call"
              disabled={isCallAttempting || disabled}
      >
        <FaPhone />
      </button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white rounded-[6px] p-2">
            {disabled ? "Group calls coming soon!" : "Voice call"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CallButtons;