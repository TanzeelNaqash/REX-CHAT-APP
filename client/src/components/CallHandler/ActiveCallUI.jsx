import { useEffect, useRef, useState } from 'react';
import { 
  FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, 
  FaVideo, FaVideoSlash, FaVolumeUp, FaVolumeMute,
  FaExclamationTriangle
} from 'react-icons/fa';
import useCallStore from '../../store/callStore';
import './CallStyles.css';
import { useAppStore } from '@/store';
import { apiClient } from '@/lib/api-client';
import { GET_USER_INFO, HOST, GET_DM_CONTACTS_ROUTE } from '@/utils/constants';

const ActiveCallUI = ({ call, onEndCall }) => {
  const { 
    localStream, 
    remoteStream,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    callDuration,
    setActiveCall
  } = useCallStore();
  
  const { userInfo } = useAppStore();
  const [recipient, setRecipient] = useState(null);
  const [streamError, setStreamError] = useState(false);
  
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fetch recipient info
  useEffect(() => {
    const getRecipient = async () => {
      try {
        const response = await apiClient.get(`${GET_USER_INFO}/${call.recipient}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${userInfo?.token}`
          }
        });
        
        if (response.data && response.data.firstName) {
          setRecipient(response.data);
        } else {
          console.error('Invalid user data received:', response.data);
          // Try to get user info from contacts
          const contactsResponse = await apiClient.get(`${GET_DM_CONTACTS_ROUTE}`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${userInfo?.token}`
            }
          });
          
          const contact = contactsResponse.data.contacts?.find(c => c._id === call.recipient);
          if (contact) {
            setRecipient({
              firstName: contact.firstName,
              lastName: contact.lastName,
              image: contact.image
            });
          } else {
            setRecipient({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        }
      } catch (error) {
        console.error("Error fetching recipient data:", error);
        // Try to get user info from contacts
        try {
          const contactsResponse = await apiClient.get(`${GET_DM_CONTACTS_ROUTE}`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${userInfo?.token}`
            }
          });
          
          const contact = contactsResponse.data.contacts?.find(c => c._id === call.recipient);
          if (contact) {
            setRecipient({
              firstName: contact.firstName,
              lastName: contact.lastName,
              image: contact.image
            });
          } else {
            setRecipient({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        } catch (contactsError) {
          console.error("Error fetching contacts:", contactsError);
          setRecipient({
            firstName: 'Unknown',
            lastName: 'User',
            image: null
          });
        }
      }
    };
    
    if (call.recipient) {
      getRecipient();
    }
  }, [call.recipient, userInfo?.token]);
  
  // Connect video streams to video elements
  useEffect(() => {
    // Handle video streams
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Check if remote video track is enabled
      const videoTrack = remoteStream.getVideoTracks()[0];
      if (videoTrack && call) {
        const isVideoEnabled = videoTrack.enabled;
        // Only update if the state is different to prevent infinite loop
        if (call.remoteVideoOff === isVideoEnabled) {
          setActiveCall({
            ...call,
            remoteVideoOff: !isVideoEnabled
          });
        }
      }
    }

    // For voice calls, handle audio
    if (!call.isVideo && remoteStream) {
      // Create audio element for remote stream
      const audioElement = new Audio();
      audioElement.srcObject = remoteStream;
      audioElement.autoplay = true;
      audioElement.muted = !call?.isSpeakerOn;

      // Store reference
      audioRef.current = audioElement;

      // Cleanup
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.srcObject = null;
          audioRef.current = null;
        }
      };
    }
  }, [localStream, remoteStream, call?.isVideo, call?.isSpeakerOn, call?.remoteVideoOff, setActiveCall]);

  // Add a separate effect to monitor remote video track changes
  useEffect(() => {
    if (!remoteStream || !call) return;

    const videoTrack = remoteStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleTrackEnded = () => {
      console.log('Remote video track ended');
      setActiveCall({
        ...call,
        remoteVideoOff: true
      });
    };

    const handleTrackEnabled = () => {
      console.log('Remote video track enabled');
      setActiveCall({
        ...call,
        remoteVideoOff: false
      });
    };

    const handleTrackDisabled = () => {
      console.log('Remote video track disabled');
      setActiveCall({
        ...call,
        remoteVideoOff: true
      });
    };

    videoTrack.addEventListener('ended', handleTrackEnded);
    videoTrack.addEventListener('enabled', handleTrackEnabled);
    videoTrack.addEventListener('disabled', handleTrackDisabled);
    
    return () => {
      videoTrack.removeEventListener('ended', handleTrackEnded);
      videoTrack.removeEventListener('enabled', handleTrackEnabled);
      videoTrack.removeEventListener('disabled', handleTrackDisabled);
    };
  }, [remoteStream, call, setActiveCall]);

  // Make sure we're not trying to use undefined activeCall properties
  const isAudioMuted = call?.isAudioMuted || false;
  const isVideoOff = call?.isVideoOff || false;
  const isSpeakerOn = call?.isSpeakerOn || false;
  
  // Handle connection error display
  useEffect(() => {
    if (call.error) {
      setStreamError(true);
    }
  }, [call.error]);

  // Handle mic toggle
  const handleMicToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Toggle the audio track's enabled state
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        
        console.log('Microphone state changed:', {
          enabled: newState,
          label: audioTrack.label,
          trackId: audioTrack.id
        });

        // Update the store state to reflect the new mic state
        if (call) {
          setActiveCall({
            ...call,
            isAudioMuted: !newState
          });
        }
      }
    }
  };

  
   // Handle speaker toggle
   const handleSpeakerToggle = () => {
    const newSpeakerState = !isSpeakerOn;
    
    if (audioRef.current) {
      audioRef.current.muted = !newSpeakerState;
    }

    // Also handle the remote stream directly
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = newSpeakerState;
      });
    }

    if (call) {
      setActiveCall({
        ...call,
        isSpeakerOn: newSpeakerState
      });
    }
  };
  
  // Update audio element when remote stream changes
  useEffect(() => {
    if (!call.isVideo && remoteStream && audioRef.current) {
      audioRef.current.muted = !isSpeakerOn;
    }
  }, [remoteStream, call.isVideo, isSpeakerOn]);
  
  return (
    <div className={`call-modal active-call ${call.isVideo ? 'video-call' : 'voice-call'}`}>
      <div className="call-header">
        <div className="call-type">
          {call.isVideo ? 'Video Call' : 'Voice Call'}
        </div>
      </div>
      
      {call.isVideo ? (
        <div className="video-container">
          {remoteStream ? (
            remoteStream.getVideoTracks()[0]?.enabled ? (
              // Remote video is ON — show video
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
                className="remote-video"
                style={{ display: 'block' }}
              />
            ) : (
              // Remote user paused video — show fallback
              <div className="remote-video-fallback">
                <div className="blur-background" />
                <div className="video-status-overlay">
                  <div className="caller-avatar large">
                    {recipient?.image ? (
                      <img
                        src={`${HOST}/${recipient.image}`}
                        alt={recipient.firstName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%',
                        }}
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {recipient?.firstName
                          ? recipient.firstName.charAt(0).toUpperCase()
                          : 'U'}
                      </div>
                    )}
                  </div>
                  <h2 className="caller-name">
                    {recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Unknown User'}
                  </h2>
                  <div className="video-status">
                    <FaVideoSlash size={24} />
                    <span>Video Paused</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="remote-video-fallback">
              <span>Waiting for remote stream...</span>
            </div>
          )}
          {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
              style={{ display: isVideoOff ? 'none' : 'block' }}
            />
          )}
          {isVideoOff && localStream && (
            <div className="local-video-fallback">
              <div className="caller-avatar small">
                {userInfo?.image ? (
                  <img 
                    src={`${HOST}/${userInfo.image}`} 
                    alt={userInfo.firstName} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  <div className="avatar-fallback">
                    {userInfo?.firstName ? userInfo.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
        </div>
            </div>
          )}
        </div>
      ) : (
        <div className="caller-info">
          <div className="caller-avatar large">
            {recipient?.image ? (
              <img 
                src={`${HOST}/${recipient.image}`} 
                alt={recipient.firstName} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <div className="avatar-fallback">
                {recipient?.firstName ? recipient.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          
          <h2 className="caller-name">
            {recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Unknown User'}
          </h2>
          
          <div className="call-status">
            {call.error ? 'Connection Error' : 'Connected'}
          </div>
          
          <div className="call-timer">{formatTime(callDuration)}</div>
        </div>
      )}
      
      <div className="call-controls">
        <button 
          className={`call-control ${isAudioMuted ? 'off' : 'on'}`} 
          onClick={handleMicToggle}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        
        {call.isVideo && (
          <button 
            className={`call-control ${isVideoOff ? 'off' : 'on'}`} 
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>
        )}
        
        <button 
          className={`call-control ${isSpeakerOn ? 'on' : 'off'}`} 
          onClick={handleSpeakerToggle}
          title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
        >
          {isSpeakerOn ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
        
        <button 
          className="call-control end" 
          onClick={onEndCall}
          title="End call"
        >
          <FaPhoneSlash />
        </button>
        
        
      </div>
    </div>
  );
};

export default ActiveCallUI;