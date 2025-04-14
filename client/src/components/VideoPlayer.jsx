import  { useRef, useEffect } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const VideoPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          "play", "progress", "current-time", "mute", "volume",
          "settings", "pip", "fullscreen"
        ],
        settings: ["quality", "speed"],
      });

      // Update video source dynamically
      playerRef.current.source = {
        type: "video",
        sources: [
          { src: url, type: "video/mp4", size: 720 }, 
        ],
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy(); 
      }
    };
  }, [url]);

  return (
    <div className="w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-lg">
    <video ref={videoRef} className="w-full h-full" controls />
  </div>
  
  );
};

export default VideoPlayer;
