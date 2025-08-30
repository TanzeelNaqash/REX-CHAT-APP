import { useEffect, useRef, useCallback, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '@/connect/SocketConnect';
import useCallStore from '../../store/callStore';
import IncomingCallUI from './IncomingCallUI';
import OutgoingCallUI from './OutgoingCallUI';
import ActiveCallUI from './ActiveCallUI';
import { useAppStore } from '@/store';
import { toast } from 'sonner'; // Import toast for notifications if available

const CallHandler = () => {
  const { 
    incomingCall, 
    outgoingCall, 
    activeCall,
    setIncomingCall,
    clearIncomingCall,
    setOutgoingCall,
    clearOutgoingCall,
    setActiveCall,
    endActiveCall,
    setLocalStream,
    setRemoteStream,
    initiateCall: storeInitiateCall,
  } = useCallStore();
  
  const { userInfo } = useAppStore();
  const peerRef = useRef(null);
  const socket = useSocket();
  const [connectionError, setConnectionError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Function to get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', videoDevices);
      setAvailableCameras(videoDevices);
      
      // If we have a virtual camera, select it by default
      const virtualCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('virtual') || 
        device.label.toLowerCase().includes('obs') ||
        device.label.toLowerCase().includes('camera')
      );
      
      if (virtualCamera) {
        setSelectedCamera(virtualCamera.deviceId);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  };

  // Call getAvailableCameras when component mounts
  useEffect(() => {
    getAvailableCameras();
  }, []);

  // Update the getUserMedia calls with virtual camera support
  const getMediaStream = async (isVideo) => {
    const constraints = {
      video: isVideo ? {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
        facingMode: "user",
        aspectRatio: { ideal: 1.777777778 },
        deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        latency: { ideal: 0 },
        focusMode: "continuous",
        exposureMode: "continuous",
        whiteBalanceMode: "continuous"
      } : false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Stream obtained with device:', {
        videoDevice: stream.getVideoTracks()[0]?.label,
        audioDevice: stream.getAudioTracks()[0]?.label
      });
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw error;
    }
  };

  // Define the initiateCall function and expose it globally in a safer way
  const createPeer = (initiator, stream) => {
    console.log('Creating peer with stream:', {
      hasStream: !!stream,
      hasAudio: stream?.getAudioTracks().length > 0,
      hasVideo: stream?.getVideoTracks().length > 0,
      audioEnabled: stream?.getAudioTracks()[0]?.enabled,
      audioTrackLabel: stream?.getAudioTracks()[0]?.label
    });

    // Ensure audio track is enabled by default
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        console.log('Local audio track enabled:', {
          enabled: audioTrack.enabled,
          label: audioTrack.label
        });
      }
    }

    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('Remote stream received:', {
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length,
        audioEnabled: remoteStream.getAudioTracks()[0]?.enabled,
        audioTrackLabel: remoteStream.getAudioTracks()[0]?.label
      });

      // Ensure remote audio is enabled
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        console.log('Remote audio track enabled:', {
          enabled: audioTrack.enabled,
          label: audioTrack.label
        });
      }

      setRemoteStream(remoteStream);
    });

    peer.on('connect', () => {
      console.log('Peer connection established');
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
      endCall();
    });

    return peer;
  };

  // Update the initiateCall function to use getMediaStream
  const initiateCall = useCallback(async (recipientId, isVideo = false) => {
    try {
      console.log('Starting call initiation process:', { recipientId, isVideo });
      
      if (incomingCall || outgoingCall || activeCall) {
        console.log('Call already in progress:', { incomingCall, outgoingCall, activeCall });
        toast?.error("A call is already in progress");
        return;
      }

      console.log('Initializing call in store...');
      const callId = storeInitiateCall(recipientId, isVideo);
      console.log('Call initialized with ID:', callId);
      
      console.log('Requesting media stream...');
      const stream = await getMediaStream(isVideo);
      
      if (!stream) {
        console.error('Failed to get media stream');
        throw new Error("Failed to get media stream");
      }
      
      // Ensure audio track is enabled by default
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        console.log('Audio track initialized:', {
          enabled: audioTrack.enabled,
          label: audioTrack.label,
          readyState: audioTrack.readyState
        });
      }
      
      console.log('Media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        audioEnabled: audioTrack?.enabled
      });
      
      // Set the stream in the store
      setLocalStream(stream);
      setConnectionError(null);
      
      // Create peer with proper configuration
      console.log('Creating peer connection...');
      
      try {
        const peer = createPeer(true, stream);
        
        console.log('Peer created successfully');
        
        // Add event listeners
        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setConnectionError("Connection failed. Please try again.");
          endCall();
      });
      
      peer.on('signal', (data) => {
          console.log('Peer signal received:', data);
        if (socket) {
            const currentOutgoingCall = useCallStore.getState().outgoingCall;
            console.log('Current outgoing call state:', currentOutgoingCall);
            
            if (!currentOutgoingCall) {
              console.error("No outgoing call data available");
              toast?.error("Unable to initiate call: Call data not available");
              clearOutgoingCall();
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              return;
            }
            
            // Update outgoing call with signal
            useCallStore.getState().setOutgoingCall({
              ...currentOutgoingCall,
              signal: data
            });
            
            console.log('Emitting call-user event:', {
              to: recipientId,
              from: userInfo?.id,
              isVideo,
              callId: currentOutgoingCall.callId
            });
            
          socket.emit('call-user', {
            to: recipientId,
            from: userInfo?.id,
            signal: data,
            name: `${userInfo?.firstName} ${userInfo?.lastName}`,
            isVideo,
              callId: currentOutgoingCall.callId
          });
        } else {
          console.error("Socket connection not available");
          toast?.error("Unable to connect: Socket connection unavailable");
          clearOutgoingCall();
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      });
      
        peerRef.current = peer;
        console.log('Peer reference set');
        
      } catch (peerError) {
        console.error('Error creating peer:', peerError);
        throw peerError;
      }
      
    } catch (error) {
      console.error("Error initiating call:", error);
      
      if (error.name === 'NotAllowedError') {
        toast?.error("Camera/Microphone access denied. Please allow access in your browser settings.");
      } else if (error.name === 'NotFoundError') {
        toast?.error("Camera or microphone not found. Please check your device.");
      } else {
        toast?.error("Failed to start call. Please try again.");
      }
      
      clearOutgoingCall();
    }
  }, [socket, userInfo, storeInitiateCall, setLocalStream, setRemoteStream, clearOutgoingCall, incomingCall, outgoingCall, activeCall]);
  
  // Expose the initiateCall method to a global context
  useEffect(() => {
    // Better approach than DOM manipulation
    window.callHandlerFunctions = {
      ...window.callHandlerFunctions,
      initiateCall
    };
    
    return () => {
      if (window.callHandlerFunctions) {
        delete window.callHandlerFunctions.initiateCall;
      }
    };
  }, [initiateCall]);
  
  // Handle incoming calls
  useEffect(() => {
    if (!socket) return;
  
    const handleIncomingCall = (data) => {
      console.log('Incoming call:', data);
      // Only accept new incoming calls if we're not already in a call
      if (!incomingCall && !outgoingCall && !activeCall) {
        setIncomingCall(data);
      } else {
        // Auto-reject if already in a call
        if (socket) {
          socket.emit('end-call', {
            to: data.from,
            callId: data.callId
          });
        }
      }
    };
    
    const handleCallAccepted = ({ signal }) => {
      console.log('Call accepted', signal);
      if (peerRef.current) {
        try {
          peerRef.current.signal(signal);
          
          // Get current stream state
          const currentStream = useCallStore.getState().localStream;
          console.log('Current stream state:', {
            hasStream: !!currentStream,
            hasAudio: currentStream?.getAudioTracks().length > 0,
            hasVideo: currentStream?.getVideoTracks().length > 0,
            audioEnabled: currentStream?.getAudioTracks()[0]?.enabled,
            audioTrackLabel: currentStream?.getAudioTracks()[0]?.label
          });
          
          // Ensure audio is enabled
          if (currentStream) {
            const audioTrack = currentStream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = true;
              console.log('Audio track enabled:', {
                enabled: audioTrack.enabled,
                label: audioTrack.label
              });
            }
          }
          
          // Set active call with timer
          setActiveCall({
            id: outgoingCall.callId,
            peer: peerRef.current,
            recipient: outgoingCall.recipient,
            isVideo: outgoingCall.isVideo,
            isAudioMuted: false,
            isVideoOff: false,
            isSpeakerOn: true, // Enable speaker by default
            startTime: Date.now() // Add start time
          });
          
          // Clear outgoing call state after successful connection
          clearOutgoingCall();
        } catch (error) {
          console.error("Error handling accepted call:", error);
          endCall();
        }
      }
    };
    
    const handleCallEnded = ({ from, callId }) => {
      console.log('Call ended by other user');
      // Stop all tracks before clearing states
      if (useCallStore.getState().localStream) {
        useCallStore.getState().localStream.getTracks().forEach(track => track.stop());
      }
      if (useCallStore.getState().remoteStream) {
        useCallStore.getState().remoteStream.getTracks().forEach(track => track.stop());
      }
      
      // Clear all call states
      endActiveCall();
      clearIncomingCall();
      clearOutgoingCall();
      toast?.info("Call ended");
    };

    const handleCallMissed = ({ reason, callId }) => {
      console.log('Call missed:', reason);
      clearOutgoingCall();
      
      if (reason === 'user-offline') {
        toast?.info("User is offline");
      } else {
        toast?.info("Call not answered");
      }

      // Stop streams
      if (useCallStore.getState().localStream) {
        useCallStore.getState().localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    };
  
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-missed', handleCallMissed);
  
    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-missed', handleCallMissed);
    };
  }, [socket, outgoingCall, setIncomingCall, setActiveCall, endActiveCall, clearIncomingCall, clearOutgoingCall, setLocalStream, incomingCall, outgoingCall, activeCall]);
  
  // Handle accepting incoming call
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    
    try {
      clearIncomingCall();
      
      const stream = await getMediaStream(incomingCall.isVideo);
      
      if (!stream) {
        throw new Error("Failed to get media stream");
      }
      
      setLocalStream(stream);
      setConnectionError(null);
      
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });
      
      peer.on('signal', (data) => {
        socket.emit('answer-call', {
          to: incomingCall.from,
          signal: data,
          callId: incomingCall.callId
        });
      });
      
      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.on('error', (err) => {
        console.error("Peer connection error:", err);
        setConnectionError("Connection failed. Please try again.");
        endCall();
      });
      
      peer.signal(incomingCall.signal);
      peerRef.current = peer;
      
      setActiveCall({
        id: incomingCall.callId,
        peer,
        recipient: incomingCall.from,
        isVideo: incomingCall.isVideo,
        isAudioMuted: false,
        isVideoOff: false,
        isSpeakerOn: false
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      
      let errorMessage = "Failed to accept call. Please try again.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera/Microphone access denied. Please allow access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Camera or microphone not found. Please check your device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera/Microphone is in use by another application. Please close other applications using your camera/microphone or try using a different device.";
      } else if (error.name === 'AbortError') {
        errorMessage = "Camera/Microphone access was aborted. Please try again.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera/Microphone constraints could not be satisfied. Please check your device settings.";
      }
      
      toast?.error(errorMessage);
      
      // Make sure to notify the caller that the call was rejected
      if (socket) {
        socket.emit('end-call', {
          to: incomingCall.from,
          callId: incomingCall.callId
        });
      }
      
      clearIncomingCall();
    }
  };
  
  // Handle rejecting incoming call
  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('end-call', {
        to: incomingCall.from,
        callId: incomingCall.callId
      });
      clearIncomingCall();
    }
  };
  
  // Handle ending an active call
  const endCall = () => {
    if (!socket) return;
    
    if (activeCall) {
      socket.emit('end-call', {
        to: activeCall.recipient,
        callId: activeCall.id
      });
      
      // Stop peer connection
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying peer:', e);
        }
        peerRef.current = null;
      }
    } else if (outgoingCall) {
      socket.emit('end-call', {
        to: outgoingCall.recipient,
        callId: outgoingCall.callId
      });
    }
    
    // Stop all tracks and clean up state
    if (useCallStore.getState().localStream) {
      useCallStore.getState().localStream.getTracks().forEach(track => track.stop());
    }
    if (useCallStore.getState().remoteStream) {
      useCallStore.getState().remoteStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    endActiveCall();
    clearOutgoingCall();
    clearIncomingCall();
    setConnectionError(null);
  };
  
  // Handle cancelling an outgoing call
  const cancelCall = () => {
    if (outgoingCall && socket) {
      socket.emit('end-call', {
        to: outgoingCall.recipient,
        callId: outgoingCall.callId
      });
      
      // Stop peer connection
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying peer:', e);
        }
        peerRef.current = null;
      }
      
      // Stop local stream
      if (useCallStore.getState().localStream) {
        useCallStore.getState().localStream.getTracks().forEach(track => track.stop());
      }
      
      setLocalStream(null);
      clearOutgoingCall();
      setConnectionError(null);
    }
  };
  
  // Handle device changes
  useEffect(() => {
    if (!navigator.mediaDevices) return;

    const handleDeviceChange = async () => {
      try {
        // Get current audio devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        console.log('Available audio devices:', {
          inputs: audioInputs.map(d => d.label),
          outputs: audioOutputs.map(d => d.label)
        });

        // If we have an active call, update the stream with new device
        if (activeCall && useCallStore.getState().localStream) {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: activeCall.isVideo
          });
          
          // Update the peer connection with new stream
          if (peerRef.current) {
            const senders = peerRef.current.getSenders();
            const audioSender = senders.find(sender => sender.track.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          }
          
          setLocalStream(newStream);
          toast?.info("Audio device updated");
        }
      } catch (error) {
        console.error('Error handling device change:', error);
      }
    };

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [activeCall, useCallStore.getState().localStream]);
  
  return (
    <div id="callHandler">
      {incomingCall && !activeCall && (
        <IncomingCallUI 
          caller={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
      
      {outgoingCall && !activeCall && (
        <OutgoingCallUI 
          call={{...outgoingCall, error: connectionError}}
          onCancel={cancelCall}
        />
      )}
      
      {activeCall && (
        <ActiveCallUI 
          call={{...activeCall, error: connectionError}}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

export default CallHandler;