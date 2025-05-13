import { useEffect, useState, useRef } from 'react';
import { FaPhone, FaPhoneSlash, FaVideo } from 'react-icons/fa';
import { apiClient } from '@/lib/api-client';
import { GET_USER_INFO, HOST, GET_DM_CONTACTS_ROUTE } from '@/utils/constants';
import { useAppStore } from '@/store';
import './CallStyles.css';

const IncomingCallUI = ({ caller, onAccept, onReject }) => {
  const ringToneRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState('incoming');
  const timerRef = useRef(null);
  const [callerData, setCallerData] = useState(null);
  const [loadingCaller, setLoadingCaller] = useState(true);
  const { userInfo } = useAppStore();

  // Fetch caller information
  useEffect(() => {
    const getCaller = async () => {
      setLoadingCaller(true);
      try {
        const response = await apiClient.get(`${GET_USER_INFO}/${caller.from}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${userInfo?.token}`
          }
        });
        
        if (response.data && response.data.firstName) {
          setCallerData(response.data);
        } else {
          console.error('Invalid user data received:', response.data);
          // Try to get user info from contacts
          const contactsResponse = await apiClient.get(`${GET_DM_CONTACTS_ROUTE}`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${userInfo?.token}`
            }
          });
          
          const contact = contactsResponse.data.contacts?.find(c => c._id === caller.from);
          if (contact) {
            setCallerData({
              firstName: contact.firstName,
              lastName: contact.lastName,
              image: contact.image
            });
          } else {
            setCallerData({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching caller:', error);
        // Try to get user info from contacts
        try {
          const contactsResponse = await apiClient.get(`${GET_DM_CONTACTS_ROUTE}`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${userInfo?.token}`
            }
          });
          
          const contact = contactsResponse.data.contacts?.find(c => c._id === caller.from);
          if (contact) {
            setCallerData({
              firstName: contact.firstName,
              lastName: contact.lastName,
              image: contact.image
            });
          } else {
            setCallerData({
              firstName: 'Unknown',
              lastName: 'User',
              image: null
            });
          }
        } catch (contactsError) {
          console.error("Error fetching contacts:", contactsError);
          setCallerData({
            firstName: 'Unknown',
            lastName: 'User',
            image: null
          });
        }
      } finally {
        setLoadingCaller(false);
      }
    };

    if (caller.from) {
      getCaller();
    }
  }, [caller.from, userInfo?.token]);

  // Initialize ringtone
  useEffect(() => {
    ringToneRef.current = new Audio('/sounds/ringtone.mp3');
    ringToneRef.current.loop = true;
    ringToneRef.current.volume = 1.0;

    return () => {
      if (ringToneRef.current) {
        ringToneRef.current.pause();
        ringToneRef.current = null;
      }
    };
  }, []);

  // Play ringtone and handle timer
  useEffect(() => {
    let timeout;
    
    const playRingTone = async () => {
      if (!ringToneRef.current || isPlaying) return;
      
      try {
        setIsPlaying(true);
        await ringToneRef.current.play();
      } catch (error) {
        console.error('Error playing ringtone:', error);
        setIsPlaying(false);
      }
    };

    // Start ringtone
    playRingTone();
    
    // Auto reject after 30 seconds
    timeout = setTimeout(() => {
      if (callStatus === 'incoming') {
      onReject();
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
  }, [onReject, isPlaying, callStatus]);

  // Handle timer when status changes to connected
  useEffect(() => {
    if (callStatus === 'connected') {
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

  // Handle accept
  const handleAccept = () => {
    if (ringToneRef.current && isPlaying) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setCallStatus('connected');
    onAccept();
  };

  // Handle reject
  const handleReject = () => {
    if (ringToneRef.current && isPlaying) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onReject();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="call-modal incoming-call">
      <div className="call-header">
        <div className="call-type">
          {caller.isVideo ? 'Video Call' : 'Voice Call'}
        </div>
      </div>
      
      <div className="caller-info">
        <div className="caller-avatar large">
          {loadingCaller ? (
            '...'
          ) : callerData?.image ? (
            <img 
              src={`${HOST}/${callerData.image}`} 
              alt={callerData.firstName} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          ) : (
            <div className="avatar-fallback">
              {callerData?.firstName ? callerData.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        
        <h2 className="caller-name">
          {loadingCaller ? 'Loading...' : 
            callerData ? `${callerData.firstName} ${callerData.lastName}` : 
            caller.name || 'Unknown User'}
        </h2>
        
        <div className="call-status">
          {callStatus === 'incoming' ? 'Incoming call...' : 'Connected'}
        </div>
        
        {callStatus === 'connected' && (
          <div className="call-timer">{formatTime(seconds)}</div>
        )}
      </div>
      
      <div className="call-actions">
        <button 
          className="call-action accept" 
          onClick={handleAccept}
        >
          {caller.isVideo ? <FaVideo /> : <FaPhone />}
        </button>
        <button 
          className="call-action decline"
          onClick={handleReject}
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
};

export default IncomingCallUI;