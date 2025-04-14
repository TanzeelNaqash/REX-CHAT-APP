import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTE, GET_GROUP_MESSAGES, HOST } from "@/utils/constants";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoCloseSharp, IoDownload } from "react-icons/io5";
import VideoPlayer from "@/components/VideoPlayer";
import { FaPlay } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";

const checkIfImage = (filePath) => {
  const imageRegex =
    /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
  return imageRegex.test(filePath);
};

const checkIfVideo = (filePath) => {
  const videoRegex = /\.(mp4|mkv|avi|mov|flv|webm|m3u8|mpd)$/i;
  return videoRegex.test(filePath);
};

const MessageContainer = () => {
  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoURL, setVideoURL] = useState(null);

  const {
    selectedChatType,
    selectedChatData,
    selectedChatMessages,
    setSelectedChatMessages,
    fileDownloadProgress,
    setFileDownloadProgress,
    isDownloading,
    setIsDownloading,
    userInfo,
  } = useAppStore();

  const [fileSizes, setFileSizes] = useState({});

  const scrollRef = useRef();

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log(error);
      }
    };
    const getGroupMessages = async ()=>{
      try {
        const response = await apiClient.get(
        `${GET_GROUP_MESSAGES}/${selectedChatData._id}`,
      
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log(error);
      }
    }
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if(selectedChatType==="group") getGroupMessages()
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  useEffect(() => {
    const fetchFileSizes = async () => {
      const sizes = {};
      for (let message of selectedChatMessages) {
        if (message.messageType === "file") {
          const fileSize = await getFileSize(message.fileUrl);
          sizes[message.fileUrl] = fileSize;
        }
      }
      setFileSizes(sizes);
    };

    if (selectedChatMessages.length > 0) {
      fetchFileSizes();
    }
  }, [selectedChatMessages]);

  const getFileSize = async (fileUrl) => {
    try {
      const response = await apiClient.head(`${HOST}/${fileUrl}`, {
        withCredentials: true,
      });
      const fileSizeInBytes = response.headers["content-length"];
      return formatBytes(fileSizeInBytes);
    } catch (error) {
      console.error("Error fetching file size:", error);
      return "Unknown size";
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-white/90 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDmMessages(message)}
          {selectedChatType === "group" && renderGroupMessages(message)}
        </div>
      );
    });
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    const response = await apiClient.get(`${HOST}/${url}`, {
      responseType: "blob",
      onDownloadProgress: (ProgressEvent) => {
        const { loaded, total } = ProgressEvent;
        const percentCompleted = Math.round((loaded * 100) / total);
        setFileDownloadProgress(percentCompleted);
      },
    });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };
  const truncateMiddle = (text, maxLength = 12) => {
    if (text.length <= maxLength) return text;
    const start = text.slice(0, 6);
    const end = text.slice(-3);
    return `${start}...${end}`;
  };

  const renderDmMessages = (message) => {
    return (
      <div
        className={`${
          message.sender === selectedChatData._id ? "text-left" : "text-right"
        }`}
      >
        {message.messageType === "text" && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#41275c] text-white rounded-2xl rounded-tr-none"
                : "bg-[#3e3e46] text-white rounded-2xl rounded-tl-none"
            }
      inline-block p-4 my-1  max-w-[50%] relative break-words`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {message.messageType === "file" && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#8417ff] text-white/90 border-none"
                : "bg-[#2a2b33] text-white/80 border-none"
            }
            border inline-block p-2 rounded my-1 max-w-[80%] sm:max-w-[200px]`}
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={`${HOST}/${message.fileUrl}`}
                  alt="file"
                  height={300}
                  width={300}
                  className="rounded-[6px]"
                />
              </div>
            ) : checkIfVideo(message.fileUrl) ? (
              <div
                className="video-container relative rounded-[6px] shadow-lg overflow-hidden"
                onClick={() => {
                  setShowVideo(true);
                  setVideoURL(message.fileUrl);
                }}
              >
                {/* <span className="cursor-pointer text-white">
                <FaPlay className="text-xl" />
                </span> */}
                <video
                  src={`${HOST}/${message.fileUrl}`}
                  height={300}
                  width={300}
                  className="rounded-[6px]"
                />
                <FaPlay className="absolute inset-0 m-auto text-white text-3xl bg-black/50 p-3 rounded-full cursor-pointer" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-5">
                <span className="text-white/80 bg-black/20 rounded-full flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 aspect-square">
                  <MdFolderZip className="text-base sm:text-lg md:text-base" />
                  {fileSizes[message.fileUrl] && (
                    <p className="text-white text-[6px] sm:text-[7px] md:text-[6px] mt-1">
                      {fileSizes[message.fileUrl]}
                    </p>
                  )}
                </span>

                <span>
                  {truncateMiddle(message.fileUrl.split("/").pop(), 15)}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    className={`relative p-3 text-1xl rounded-xl cursor-pointer transition-all duration-300 ${
                      isDownloading
                        ? "bg-transparent"
                        : "bg-black/20 hover:bg-black/50"
                    }`}
                    onClick={() => downloadFile(message.fileUrl)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <div
                        className="absolute inset-0 border-2 border-dashed border-white/80 rounded-full"
                        style={{
                          animation: `border-fill ${
                            100 / (fileDownloadProgress + 1)
                          }s linear forwards`,
                          borderWidth: "2px",
                          borderColor: "blue",
                          borderStyle: "dashed",
                        }}
                      ></div>
                    ) : (
                      <IoDownload />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-white/90 mb-5">
          {moment(message.timestamp).format("LT")}
        </div>
      </div>
    );
  };

  
  const renderGroupMessages = (message) => {
    const isSender = message.sender._id === userInfo.id;
  
    return (
      <div className={`mt-5 flex ${isSender ? "justify-end" : "justify-start"}`}>
        {!isSender && (
          <div className="mr-2">
            <Avatar className="h-8 w-8 rounded-full overflow-hidden">
              {message.sender.image ? (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black"
                />
              ) : (
                <AvatarFallback
                  className={`uppercase h-8 w-8 text-lg flex items-center justify-center rounded-full ${getColor(
                    message.sender.color
                  )}`}
                >
                  {message.sender.firstName
                    ? message.sender.firstName[0]
                    : message.sender.email[0]}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        )}
  
        <div className="flex flex-col">
          {!isSender && (
            <span className="text-sm text-white/60 mb-1">
              {`${message.sender.firstName} ${message.sender.lastName}`}
            </span>
          )}
  
          {/* Render Text Message Inside Bubble */}
          {message.messageType === "text" && (
            <div
              className={`${
                isSender
                  ? "bg-[#41275c] text-white rounded-2xl rounded-tr-none"
                  : "bg-[#3e3e46] text-white rounded-2xl rounded-tl-none"
              } inline-block p-3 my-1 max-w-[80%] sm:max-w-[250px] relative`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
             
            </div>
          )}
  
          {/* Render File Messages Without Chat Bubble */}
          {message.messageType === "file" && message.fileUrl && (
            <div className="my-1 max-w-[80%] sm:max-w-[250px]">
              {checkIfImage(message.fileUrl) ? (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setShowImage(true);
                    setImageURL(message.fileUrl);
                  }}
                >
                  <img
                    src={`${HOST}/${message.fileUrl}`}
                    alt="file"
                    className="rounded-[6px] w-full h-auto"
                  />
                </div>
              ) : checkIfVideo(message.fileUrl) ? (
                <div
                  className="relative rounded-[6px] shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    setShowVideo(true);
                    setVideoURL(message.fileUrl);
                  }}
                >
                  <video
                    src={`${HOST}/${message.fileUrl}`}
                    className="rounded-[6px] w-full h-auto"
                    controls
                  />
                  <FaPlay className="absolute inset-0 m-auto text-white text-3xl bg-black/50 p-3 rounded-full" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2 bg-[#2a2b33] text-white/80 rounded">
                  <span className="bg-black/20 rounded-full flex items-center justify-center w-10 h-10">
                    <MdFolderZip className="text-lg" />
                  </span>
  
                  <span>{truncateMiddle(message.fileUrl.split("/").pop(), 15)}</span>
  
                  <button
                    className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      isDownloading ? "bg-transparent" : "bg-black/20 hover:bg-black/50"
                    }`}
                    onClick={() => downloadFile(message.fileUrl)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <div
                        className="absolute inset-0 border-2 border-dashed border-white/80 rounded-full"
                        style={{
                          animation: `border-fill ${
                            100 / (fileDownloadProgress + 1)
                          }s linear forwards`,
                        }}
                      ></div>
                    ) : (
                      <IoDownload />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
              <div className="text-xs text-white/60 mt-1 block">
                {moment(message.timestamp).format("LT")}
              </div>
        </div>
      </div>
    );
  };
  
  

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full"
      style={{
        backgroundImage: `url('${HOST}/${userInfo.backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {renderMessages()}
      <div ref={scrollRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
          <div>
            <img
              src={`${HOST}/${imageURL}`}
              className="h-[80vh] w-full bg-cover transition-transform duration-300 ease-in-out transform hover:scale-110 cursor-zoom-in"
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-1xl rounded-xl hover:bg-black/50 cursor-pointer transition-all duration-300 "
              onClick={() => downloadFile(imageURL)}
            >
              <IoDownload />
            </button>
            <button
              className="bg-black/20 p-3 text-1xl rounded-xl hover:bg-black/50 cursor-pointer transition-all duration-300 "
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}

      {showVideo && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
          <VideoPlayer url={`${HOST}/${videoURL}`} />
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-1xl rounded-xl hover:bg-black/50 cursor-pointer transition-all duration-300 "
              onClick={() => {
                downloadFile(videoURL);
              }}
            >
              <IoDownload />
            </button>
            <button
              className="bg-black/20 p-3 text-1xl rounded-xl hover:bg-black/50 cursor-pointer transition-all duration-300 "
              onClick={() => {
                setShowVideo(false);
                setVideoURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
