import { useEffect, useState, useRef } from 'react';
import { FaPhoneSlash, FaExclamationTriangle, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

import { apiClient } from '@/lib/api-client';
import { GET_USER_INFO, HOST, GET_DM_CONTACTS_ROUTE } from '@/utils/constants';
import { useAppStore } from '@/store';
import useCallStore from '@/store/callStore';
import './CallStyles.css';

const OutgoingCallUI = ({ call, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const { userInfo } = useAppStore();
  const { toggleAudio } = useCallStore();
  const ringToneRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [callStatus, setCallStatus] = useState('calling');
  const timerRef = useRef(null);

  const [recipient, setRecipient] = useState(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Initialize ringtone
  useEffect(() => {
    ringToneRef.current = new Audio('/sounds/outgoing-call.mp3');
    ringToneRef.current.loop = true;
    ringToneRef.current.volume = 1.0;

    return () => {
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current = null;
      }
    };
  }, []);

  // Fetch recipient information
  useEffect(() => {
    const getRecipient = async () => {
      setLoadingRecipient(true);
      setFetchError(false);
      try {
        const response = await apiClient.get(`${GET_USER_INFO}/${call.recipient}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${userInfo?.token}`
          }
        });
        
        if (response.data && response.data.firstName) {
          setRecipient(response.data);
          setFetchError(false);
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
            setFetchError(false);
        } else {
          setFetchError(true);
            setRecipient({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching recipient:', error);
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
            setFetchError(false);
          } else {
            setFetchError(true);
            setRecipient({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        } catch (contactsError) {
          console.error("Error fetching contacts:", contactsError);
        setFetchError(true);
          setRecipient({
            firstName: 'Unknown',
            lastName: 'User',
            image: null
          });
        }
      } finally {
        setLoadingRecipient(false);
      }
    };

    if (call.recipient) {
      getRecipient();
    }
  }, [call.recipient, userInfo?.token]);

  // Play ringback tone and handle timer
  useEffect(() => {
    let timeout;
    
    const playRingTone = async () => {
      if (!ringToneRef.current || isPlaying) return;
      
      try {
        setIsPlaying(true);
        await ringToneRef.current.play();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error playing ringback tone:', error);
        }
        setIsPlaying(false);
      }
    };

    // Start ringback tone
    playRingTone();

    // Auto cancel after 30 seconds if still calling
    timeout = setTimeout(() => {
      if (callStatus === 'calling') {
      onCancel();
      }
    }, 30000);

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (ringToneRef.current && isPlaying) {
        ringToneRef.current.pause();
        ringToneRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };
  }, [onCancel, isPlaying, callStatus]);

  // Handle timer when status changes to ringing
  useEffect(() => {
    if (callStatus === 'ringing') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Handle cancel
  const handleCancel = () => {
    if (ringToneRef.current && isPlaying) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onCancel();
  };

  // Handle mic toggle
  const handleMicToggle = () => {
    console.log('Toggling mic for outgoing call:', {
      currentState: call.isAudioMuted,
      hasLocalStream: !!useCallStore.getState().localStream
    });
    
    // Get current call state
    const currentCall = useCallStore.getState().outgoingCall;
    if (currentCall) {
      // Update call state while preserving other properties
      useCallStore.getState().setOutgoingCall({
        ...currentCall,
        isAudioMuted: !currentCall.isAudioMuted
      });
    }
    
    toggleAudio();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update call status based on peer signal
  useEffect(() => {
    const checkPeerSignal = () => {
      const currentCall = useCallStore.getState().outgoingCall;
      if (currentCall?.signal) {
        console.log('Peer signal received, changing status to ringing');
        setCallStatus('ringing');
        // Clear the interval once we've received the signal
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    };

    // Check immediately
    checkPeerSignal();

    // Set up interval to check periodically
    const intervalId = setInterval(checkPeerSignal, 1000);

    return () => {
      clearInterval(intervalId);
  };
  }, []);

  return (
    <div className="call-modal outgoing-call">
      <div className="call-header">
        <div className="call-type">
          {call.isVideo ? 'Video Call' : 'Voice Call'}
        </div>
      </div>

      <div className="caller-info">
        {call.error && (
          <div className="connection-error">
            <FaExclamationTriangle />
            <p>{call.error}</p>
          </div>
        )}
        
        <div className="caller-avatar large">
          {loadingRecipient ? (
            '...'
          ) : recipient?.image ? (
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
          {loadingRecipient ? 'Loading...' : 
            fetchError ? 'User not found' :
            recipient ? `${recipient.firstName} ${recipient.lastName}` : 
            'Unknown User'}
        </h2>
        
        <div className="call-status">
          {callStatus === 'calling' ? 'Calling...' : 
           callStatus === 'ringing' ? 'Ringing...' : 
           call.error ? 'Connection Error' : 'Connecting...'}
        </div>
        
        {callStatus === 'connected' && (
          <div className="call-timer">{formatTime(seconds)}</div>
        )}
      </div>

      <div className="call-actions">
        <button 
          className={`call-control ${call.isAudioMuted ? 'off' : 'on'}`}
          onClick={handleMicToggle}
          title={call.isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {call.isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        
        <button 
          className="call-action cancel"
          onClick={handleCancel}
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
};

export default OutgoingCallUI;