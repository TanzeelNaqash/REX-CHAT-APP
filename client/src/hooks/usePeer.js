import { useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';

export const usePeer = () => {
  const peerRef = useRef(null);

  const createPeer = useCallback((stream, isInitiator = true) => {
    try {
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: stream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });

      return peer;
    } catch (error) {
      console.error('Error creating peer:', error);
      throw error;
    }
  }, []);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (error) {
        console.error('Error destroying peer:', error);
      }
      peerRef.current = null;
    }
  }, []);

  return {
    peerRef,
    createPeer,
    destroyPeer
  };
}; 