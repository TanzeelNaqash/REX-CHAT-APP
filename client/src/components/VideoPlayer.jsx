import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiSkipBack,
  FiSkipForward,
} from "react-icons/fi";
import { MdSettings, MdClosedCaption } from "react-icons/md";

const VideoPlayer = ({ url, poster }) => {
  // Player states
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState({ played: 0, loaded: 0 });
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showTapControls, setShowTapControls] = useState(false);
  const [tapAction, setTapAction] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [subtitleFile, setSubtitleFile] = useState(null);

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsRef = useRef(null);
  const settingsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Available quality options
  const qualityOptions = [
    { value: "auto", label: "Auto" },
    { value: "1080", label: "1080p" },
    { value: "720", label: "720p" },
    { value: "480", label: "480p" },
    { value: "360", label: "360p" },
  ];

  // Playback speed options
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Toggle play/pause
  const togglePlay = () => {
    setPlaying(!playing);
    flashTapControl(playing ? "pause" : "play");
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    setMuted(!muted);
    flashTapControl(muted ? "unmute" : "mute");
  };

  // Handle progress
  const handleProgress = (state) => {
    setProgress(state);
  };

  // Handle duration
  const handleDuration = (duration) => {
    setDuration(duration);
  };

  // Handle seek
  const handleSeek = (e) => {
    const seekTo = parseFloat(e.target.value);
    playerRef.current.seekTo(seekTo, "fraction");
    setProgress({ ...progress, played: seekTo });
  };
  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekMouseUp = (e) => {
    const seekTo = parseFloat(e.target.value);
    playerRef.current.seekTo(seekTo, "fraction");
    setProgress({ ...progress, played: seekTo });
    setPlaying(true);
    setIsDragging(false);
  };

  // Skip forward/backward
  const skip = (seconds) => {
    const newTime = playerRef.current.getCurrentTime() + seconds;
    playerRef.current.seekTo(newTime, "seconds");
    flashTapControl(seconds > 0 ? "forward" : "backward");
  };

  // Toggle fullscreen - FIXED
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    try {
      // Check for browser prefixed methods
      const requestFullscreen = 
        playerContainerRef.current.requestFullscreen ||
        playerContainerRef.current.webkitRequestFullscreen ||
        playerContainerRef.current.mozRequestFullScreen ||
        playerContainerRef.current.msRequestFullscreen;
        
      const exitFullscreen = 
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
        
      const fullscreenElement = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!fullscreenElement) {
        requestFullscreen.call(playerContainerRef.current)
          .then(() => {
            setIsFullscreen(true);
          })
          .catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
          });
      } else {
        exitFullscreen.call(document)
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            console.error("Error attempting to exit fullscreen:", err);
            // Force the state update even if the method fails
            setIsFullscreen(false);
          });
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      // Toggle the state anyway to maintain UI consistency
      setIsFullscreen(!isFullscreen);
    }
  };

  // Flash tap control indicator
  const flashTapControl = (action) => {
    setTapAction(action);
    setShowTapControls(true);
    setTimeout(() => {
      setShowTapControls(false);
      setTapAction(null);
    }, 500);
  };

  // Format time (seconds to HH:MM:SS)
  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");

    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Handle screen taps
  const handleScreenTap = () => {
    // Middle section - toggle play/pause
    togglePlay();
  };

  // Hide controls after inactivity
  useEffect(() => {
    let timeout;
    const resetControlsTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    resetControlsTimeout();

    return () => clearTimeout(timeout);
  }, [playing, progress]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle fullscreen change events - FIXED
  useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      
      setIsFullscreen(!!fullscreenElement);
    };

    // Add all possible fullscreen change event listeners
    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);
    document.addEventListener("mozfullscreenchange", updateFullscreenState);
    document.addEventListener("MSFullscreenChange", updateFullscreenState);

    return () => {
      // Clean up all added event listeners
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
      document.removeEventListener("mozfullscreenchange", updateFullscreenState);
      document.removeEventListener("MSFullscreenChange", updateFullscreenState);
    };
  }, []);
  
  useEffect(() => {
    return () => {
      if (subtitleFile?.url) URL.revokeObjectURL(subtitleFile.url);
    };
  }, [subtitleFile]);

  const convertSrtToVtt = async (file) => {
    const text = await file.text();
    const vttText = "WEBVTT\n\n" + text.replace(/,/g, ".");
    const blob = new Blob([vttText], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const vttUrl = file.name.endsWith(".srt")
        ? await convertSrtToVtt(file)
        : URL.createObjectURL(file);
      setSubtitleFile({ url: vttUrl, type: "text/vtt" });
    }
  };
    
  return (
    <div
      ref={playerContainerRef}
      className="relative w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden group"
    >
      {/* Video Player */}
      <div
        className="relative w-full aspect-video"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => !playing && setShowControls(false)}
      >
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={muted ? 0 : volume}
          playbackRate={playbackRate}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onDuration={handleDuration}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          light={poster}
          config={{
            file: {
              attributes: {
                controlsList: "nodownload",
                disablePictureInPicture: true,
              },
              tracks: subtitleFile
  ? [
      {
        kind: "subtitles",
        src: subtitleFile.url,
        srcLang: "en",
        label: "User Subtitle",
        default: true,
      },
    ]
  : [],

            },
          }}
        />
     <div
  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
>
  <div
    className="w-32 h-32 pointer-events-auto"
    onClick={handleScreenTap}
  />
</div>

        {/* Tap Controls Indicator */}
        {showTapControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-4 rounded-full bg-black/70 text-white text-4xl transition-all duration-300 animate-pulse">
              {tapAction === "play" && <FiPlay />}
              {tapAction === "pause" && <FiPause />}
              {tapAction === "mute" && <FiVolumeX />}
              {tapAction === "unmute" && <FiVolume2 />}
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div
            ref={controlsRef}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
          >
            {/* Progress Bar */}
            <div className="relative w-full mb-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress.played}
                onMouseDown={handleSeekMouseDown}
                onChange={(e) =>
                  setProgress({
                    ...progress,
                    played: parseFloat(e.target.value),
                  })
                }
                onMouseUp={handleSeekMouseUp}
                className={`w-full h-1 appearance-none rounded-full bg-gray-700 transition-all ${
                  isDragging ? "cursor-grabbing" : "cursor-pointer"
                }`}
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    progress.played * 100
                  }%, #4b5563 ${progress.played * 100}%)`,
                }}
              />
              {isDragging && (
                <div
                  className="absolute top-0 -mt-1 w-3 h-3 bg-blue-500 rounded-full"
                  style={{
                    left: `${progress.played * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {playing ? <FiPause size={20} /> : <FiPlay size={20} />}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {muted || volume === 0 ? (
                      <FiVolumeX size={18} />
                    ) : (
                      <FiVolume2 size={18} />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 rounded-full appearance-none bg-gray-600 cursor-pointer transition hover:h-1.5"
                  />
                </div>

                <span className="text-sm text-gray-300 hidden md:block">
                  {formatTime(progress.played * duration)} /{" "}
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
              <button
  onClick={() => {
    if (subtitleFile) {
      setCaptionsEnabled(!captionsEnabled); // toggle visibility
    } else {
      fileInputRef.current.click(); // open file picker
    }
  }}
  className="relative text-white hover:text-gray-300 transition-colors"
>
  <MdClosedCaption size={20} />
  {captionsEnabled && subtitleFile && (
    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-sm"></span>
  )}
</button>

<input
  type="file"
  accept=".vtt,.srt"
  ref={fileInputRef}
  onChange={handleFileChange}
  className="hidden"
/>


                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <MdSettings size={20} />
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-10 right-0 w-40 md:w-48 bg-gray-800 rounded-md shadow-lg z-10 overflow-hidden">
                      {/* <div className="p-2 border-b border-gray-700">
                        <h3 className="text-sm font-medium text-white px-2 py-1">
                          Quality
                        </h3>
                        {qualityOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setQuality(option.value);
                              setShowSettings(false);
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm rounded ${
                              quality === option.value
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div> */}
                      <div className="p-2 ">
                        <h3 className="text-xs md:text-sm font-medium text-white px-2 py-1">
                          Playback Speed
                        </h3>
                        <div className="grid grid-cols-2 gap-1">
                        {speedOptions.map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackRate(speed);
                              setShowSettings(false);
                            }}
                            className={`block w-full text-left px-2 py-1 text-xs md:text-sm rounded ${
                              playbackRate === speed
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                        </div>
                       
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isFullscreen ? (
                    <FiMinimize size={18} />
                  ) : (
                    <FiMaximize size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
     
    </div>
    
  );
};

export default VideoPlayer;