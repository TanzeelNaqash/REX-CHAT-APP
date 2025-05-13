import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install this package

const useCallStore = create((set, get) => ({
  // Call state
  incomingCall: null,
  outgoingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  callDuration: 0,
  intervalId: null,
  callStartTime: null,
  timerInterval: null,
  
  // Set incoming call
  setIncomingCall: (callData) => set({ incomingCall: callData }),
  
  // Clear incoming call
  clearIncomingCall: () => set({ incomingCall: null }),
  
  // Initialize outgoing call
  initiateCall: (recipient, isVideo = false) => {
    console.log('CallStore: Initiating call', { recipient, isVideo });
    const callId = uuidv4();
    const callData = {
        recipient, 
        isVideo,
        callId,
      status: 'calling',
      startTime: new Date().toISOString(),
      isAudioMuted: false // Initialize audio state
    };
    
    console.log('CallStore: Setting outgoing call data', callData);
    set({ outgoingCall: callData });
    return callId;
  },
  
  // Set outgoing call
  setOutgoingCall: (call) => {
    set((state) => {
      // If there's an existing outgoing call, preserve its signal
      const existingCall = state.outgoingCall;
      const signal = call.signal || (existingCall ? existingCall.signal : null);
      
      // Update status based on signal presence
      const status = signal ? 'ringing' : 'calling';
      
      return {
        ...state,
        outgoingCall: {
          ...call,
          signal,
          status,
          isAudioMuted: call.isAudioMuted ?? false,
          isVideoOff: call.isVideoOff ?? false,
          isSpeakerOn: call.isSpeakerOn ?? false,
          error: null
        }
      };
    });
  },
  
  // Clear outgoing call
  clearOutgoingCall: () => {
    console.log('CallStore: Clearing outgoing call');
    // Don't stop the stream here as it's needed for active call
    set({ outgoingCall: null });
  },
  
  // Set active call
  setActiveCall: (callData) => {
    set((state) => {
      // If we're updating an existing call, preserve the timer state
      const existingCall = state.activeCall;
      const startTime = existingCall?.startTime || Date.now();
      const callDuration = existingCall ? state.callDuration : 0;
      
      // Only start a new timer if this is a new call
      if (!existingCall) {
        // Clear any existing interval
        if (state.intervalId) {
          clearInterval(state.intervalId);
        }
        
        // Start new timer
        const newIntervalId = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
    
        return {
          ...state,
          activeCall: {
            ...callData,
            startTime,
            isAudioMuted: callData.isAudioMuted ?? false,
            isVideoOff: callData.isVideoOff ?? false,
            remoteVideoOff: callData.remoteVideoOff ?? false,
            isSpeakerOn: callData.isSpeakerOn ?? false
          },
          callDuration,
          intervalId: newIntervalId,
          callStartTime: startTime
        };
      }
      
      // For existing call updates, just update the call properties
      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          ...callData,
          startTime: existingCall.startTime, // Preserve original start time
          remoteVideoOff: callData.remoteVideoOff ?? state.activeCall.remoteVideoOff
        }
      };
    });
  },
  
  // End active call
  endActiveCall: () => {
    const { intervalId, localStream, remoteStream } = get();
    
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Stop all tracks when call ends
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    set({ 
      activeCall: null, 
      localStream: null,
      remoteStream: null,
      callDuration: 0,
      intervalId: null
    });
  },
  
  // Set local stream
  setLocalStream: (stream) => {
    console.log('CallStore: Setting local stream', {
      hasAudio: stream?.getAudioTracks().length > 0,
      hasVideo: stream?.getVideoTracks().length > 0
    });
    set({ localStream: stream });
  },
  
  // Set remote stream
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  
  // Toggle audio
  toggleAudio: () => {
    const { localStream, activeCall, outgoingCall } = get();
    
    // Log current state for debugging
    console.log('Toggle audio called:', {
      hasLocalStream: !!localStream,
      hasActiveCall: !!activeCall,
      hasOutgoingCall: !!outgoingCall,
      streamState: localStream ? {
        audioTracks: localStream.getAudioTracks().length,
        videoTracks: localStream.getVideoTracks().length,
        audioEnabled: localStream.getAudioTracks()[0]?.enabled,
        audioTrackLabel: localStream.getAudioTracks()[0]?.label
      } : null
    });

    if (!localStream) {
      console.warn('No local stream available');
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in local stream');
      return;
    }

    const audioTrack = audioTracks[0];
    const newEnabled = !audioTrack.enabled;
    
    try {
      // First update the audio track state
      audioTrack.enabled = newEnabled;
      console.log('Audio track enabled:', {
        enabled: newEnabled,
        label: audioTrack.label,
        readyState: audioTrack.readyState,
        callType: activeCall ? 'active' : 'outgoing'
      });
      
      // Then update the store state
      if (activeCall) {
        set({
          activeCall: {
            ...activeCall,
            isAudioMuted: !newEnabled
          }
        });
      } else if (outgoingCall) {
        set({
          outgoingCall: {
            ...outgoingCall,
            isAudioMuted: !newEnabled
          }
        });
      }

      // Log the updated state
      console.log('Updated audio state:', {
        audioTrackEnabled: audioTrack.enabled,
        storeState: activeCall ? activeCall.isAudioMuted : outgoingCall?.isAudioMuted
      });
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  },
  
  // Toggle video
  toggleVideo: () => {
    const { localStream, activeCall } = get();
    if (localStream && activeCall && activeCall.isVideo) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({
          activeCall: {
            ...activeCall,
            isVideoOff: !videoTrack.enabled
          }
        });
      }
    }
  },
  
  // Toggle speaker
  toggleSpeaker: () => {
    const { activeCall, remoteStream } = get();
    if (activeCall) {
      const newSpeakerState = !activeCall.isSpeakerOn;
      console.log('Toggling speaker:', {
        currentState: activeCall.isSpeakerOn,
        newState: newSpeakerState,
        hasRemoteStream: !!remoteStream,
        audioEnabled: remoteStream?.getAudioTracks()[0]?.enabled
      });
      
      // Update the store state
      set({
        activeCall: {
          ...activeCall,
          isSpeakerOn: newSpeakerState
        }
      });
    }
  },
  
  // Format call duration
  formatCallDuration: () => {
    if (!get().callStartTime) return '00:00';
    
    const now = Date.now();
    const duration = Math.floor((now - get().callStartTime) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },
  
  // Start call timer
  startCallTimer: () => {
    if (get().timerInterval) {
      clearInterval(get().timerInterval);
    }
    
    set({ callStartTime: Date.now() });
    set({
      timerInterval: setInterval(() => {
        set((state) => {
          if (!state.activeCall) return state;
          return {
            activeCall: {
              ...state.activeCall,
              duration: useCallStore.getState().formatCallDuration()
            }
          };
        });
      }, 1000)
    });
  }
}));

export default useCallStore;