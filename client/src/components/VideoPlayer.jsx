import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client'; // Correct import for React 18+
import videojs from 'video.js';
import '@videojs/http-streaming/dist/videojs-http-streaming.min.js'; // Import VHS for HLS/DASH support
import 'video.js/dist/video-js.css'; // Don't forget to import the CSS
import { FaBackward, FaForward, FaCog } from 'react-icons/fa'; // Importing React Icons

const VideoPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false); // Track buffering state
  const [qualityLevels, setQualityLevels] = useState([]); // Track available quality levels
  const [selectedQuality, setSelectedQuality] = useState(null); // Track selected quality level

  useEffect(() => {
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: true,  // Set to autoplay on load
      preload: 'auto',
      techOrder: ['html5'],
      sources: [
        {
          src: url,
          type: url.endsWith('m3u8') ? 'application/x-mpegURL' : url.endsWith('mpd') ? 'application/dash+xml' : '',
        },
      ],
      playbackRates: [0.5, 1, 1.5, 2], // Speed control (0.5x, 1x, 1.5x, 2x)
      liveui: true, // Enable live streaming UI features (if needed)
    });

    // Monitor quality switch for HLS/DASH
    player.ready(() => {
      const hls = player.hls;
      const dash = player.dash;

      // For HLS
      if (hls) {
        hls.on('levelswitched', () => {
          const currentLevel = hls.levels[hls.currentLevel];
          console.log('Switched to quality level: ', currentLevel.height);
          setSelectedQuality(currentLevel); // Update selected quality level
        });

        // Get the available quality levels for HLS
        hls.on('levels', (event, levels) => {
          console.log('Available HLS levels:', levels);
          setQualityLevels(levels); // Set the available quality levels
        });
      }

      // For DASH
      if (dash) {
        dash.on('qualitylevelswitched', () => {
          const currentLevel = dash.levels[dash.currentLevel];
          console.log('Switched to quality level: ', currentLevel.height);
          setSelectedQuality(currentLevel); // Update selected quality level
        });

        // Get the available quality levels for DASH
        dash.on('qualitylevels', (event, levels) => {
          console.log('Available DASH levels:', levels);
          setQualityLevels(levels); // Set the available quality levels
        });
      }
    });

    // Add custom rewind and fast-forward buttons with React Icons
    const controlBar = player.controlBar;

    // Rewind button with FaBackward icon
    const rewindButton = controlBar.addChild('button', {});
    rewindButton.addClass('vjs-rewind-button vjs-control vjs-button bg-blue-500 hover:bg-blue-700');
    rewindButton.el().setAttribute('title', 'Rewind');
    ReactDOM.createRoot(rewindButton.el()).render(<FaBackward size={20} color="white" />);
    rewindButton.on('click', () => {
      const currentTime = player.currentTime();
      player.currentTime(currentTime - 10); // Rewind by 10 seconds
    });

    // Forward button with FaForward icon
    const forwardButton = controlBar.addChild('button', {});
    forwardButton.addClass('vjs-forward-button vjs-control vjs-button bg-blue-500 hover:bg-blue-700');
    forwardButton.el().setAttribute('title', 'Forward');
    ReactDOM.createRoot(forwardButton.el()).render(<FaForward size={20} color="white" />);
    forwardButton.on('click', () => {
      const currentTime = player.currentTime();
      player.currentTime(currentTime + 10); // Fast forward by 10 seconds
    });

    // Custom quality selector
    const qualityButton = controlBar.addChild('button', {});
    qualityButton.addClass('vjs-quality-button vjs-control vjs-button bg-blue-500 hover:bg-blue-700');
    qualityButton.el().setAttribute('title', 'Quality Settings');
    ReactDOM.createRoot(qualityButton.el()).render(<FaCog size={20} color="white" />);
    qualityButton.on('click', () => {
      if (qualityLevels.length > 0) {
        // Clear existing buttons and create new ones dynamically
        const existingButtons = document.querySelectorAll('.vjs-quality-button-item');
        existingButtons.forEach((btn) => btn.remove());

        qualityLevels.forEach((level, index) => {
          const button = document.createElement('button');
          button.className = 'vjs-quality-button-item vjs-control vjs-button bg-blue-500 hover:bg-blue-700';
          button.innerText = `${level.height}p`;
          button.addEventListener('click', () => {
            if (hls) {
              hls.currentLevel = index; // Switch quality level for HLS
            }
            if (dash) {
              dash.currentLevel = index; // Switch quality level for DASH
            }
            setSelectedQuality(level); // Update the selected quality
          });

          // Append button to the control bar
          controlBar.el().appendChild(button);
        });
      }
    });

    // Detect buffering state (show a loading indicator when buffering)
    player.on('waiting', () => {
      setIsBuffering(true); // Video is buffering
    });
    player.on('playing', () => {
      setIsBuffering(false); // Video has started playing
    });

    // Error handling
    player.on('error', () => {
      console.error('Video.js error:', player.error());
    });

    // Dispose the player on unmount
    return () => {
      player.dispose();
    };
  }, [url, qualityLevels]);

  return (
    <div className="relative">
      <div className={`absolute inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 ${isBuffering ? 'block' : 'hidden'}`}>
        <div className="text-white text-lg">Buffering...</div>
      </div>
      <video ref={videoRef} className="video-js vjs-default-skin" />
    </div>
  );
};

export default VideoPlayer;
