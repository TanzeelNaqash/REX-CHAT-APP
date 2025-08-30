import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTE, GET_GROUP_MESSAGES, HOST } from "@/utils/constants";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoCloseSharp, IoDownload } from "react-icons/io5";
import VideoPlayer from "@/components/VideoPlayer";
import { FaPlay, FaCheck, FaCheckDouble } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/EmojiPicker";


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
  const scrollRef = useRef(null);
  const containerRef = useRef(null);

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

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedChatMessages]);

  // Scroll to bottom when chat changes
  useEffect(() => {
    scrollToBottom();
  }, [selectedChatData]);

  // Scroll to bottom when images or videos are closed
  useEffect(() => {
    if (!showImage && !showVideo) {
      scrollToBottom();
    }
  }, [showImage, showVideo]);

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

  const formatMessageDate = (timestamp) => {
    const messageDate = moment(timestamp);
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const sevenDaysAgo = moment().subtract(7, 'days').startOf('day');

    if (messageDate.isSame(today, 'day')) {
      return 'Today';
    } else if (messageDate.isSame(yesterday, 'day')) {
      return 'Yesterday';
    } else if (messageDate.isAfter(sevenDaysAgo)) {
      return messageDate.format('dddd');
    } else {
      return messageDate.format('MMMM D, YYYY');
    }
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
            <div className="text-center text-white/90 my-2 bg-[#2f3d46] w-fit mx-auto rounded-md px-2 py-1">
              {formatMessageDate(message.timestamp)}
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

  const renderMessageStatus = (message) => {
    if (message.sender === selectedChatData._id) {
      return (
        <div className="flex items-center gap-[2px] ml-[4px]">
          {message.status === 'sent' && <FaCheck className="text-[11px] text-white/60" />}
          {message.status === 'delivered' && <FaCheckDouble className="text-[11px] text-white/60" />}
          {message.status === 'read' && <FaCheckDouble className="text-[11px] text-[#53bdeb]" />}
        </div>
      );
    }
    return null;
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
                ? "bg-[#79227c] text-white rounded-[7.5px] rounded-tr-none"
                : "bg-[#202C33] text-white rounded-[7.5px] rounded-tl-none"
            }
     inline-block px-[6px] py-[4px] my-[4px] max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[45%] relative select-text`}
          >
            <div className="min-w-[60px]">
              <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] pr-[52px] break-words [user-select:text] [&::selection]:bg-[#79227c]/30 [&::selection]:text-white">{message.content}</p>
              <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                <span className="text-[11px] text-white/60">
                  {moment(message.timestamp).format("h:mm A")}
                </span>
                {renderMessageStatus(message)}
              </div>
            </div>
          </div>
        )}

        {message.messageType === "file" && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#79227c] text-white/90"
                : "bg-[#202C33] text-white/80"
            }
            inline-block p-[6px] rounded-[7.5px] my-[4px] max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[45%] relative`}
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
                  className="rounded-[4px] w-full h-auto"
                />
                <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                  <span className="text-[11px] text-white/60">
                    {moment(message.timestamp).format("h:mm A")}
                  </span>
                  {renderMessageStatus(message)}
                </div>
              </div>
            ) : checkIfVideo(message.fileUrl) ? (
              <div
                className="relative"
                onClick={() => {
                  setShowVideo(true);
                  setVideoURL(message.fileUrl);
                }}
              >
                <video
                  src={`${HOST}/${message.fileUrl}`}
                  className="rounded-[4px] w-full h-auto"
                />
                <FaPlay className="absolute inset-0 m-auto text-white text-3xl bg-black/50 p-3 rounded-full cursor-pointer" />
                <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                  <span className="text-[11px] text-white/60">
                    {moment(message.timestamp).format("h:mm A")}
                  </span>
                  {renderMessageStatus(message)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-[12px] min-w-[200px]">
                <span className="text-white/80 bg-black/20 rounded-full flex flex-col items-center justify-center w-[48px] h-[48px] shrink-0">
                  <MdFolderZip className="text-[24px]" />
                  {fileSizes[message.fileUrl] && (
                    <p className="text-white text-[10px] mt-[2px]">
                      {fileSizes[message.fileUrl]}
                    </p>
                  )}
                </span>

                <span className="text-[14.2px] truncate max-w-[120px]">
                  {truncateMiddle(message.fileUrl.split("/").pop(), 15)}
                </span>

                <div className="flex items-center shrink-0">
                  <button
                    className={`relative p-[8px] text-[20px] rounded-[4px] cursor-pointer transition-all duration-300 ${
                      isDownloading
                        ? "bg-transparent"
                        : "bg-black/20 hover:bg-black/30"
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
                <div className="flex items-center gap-[2px] shrink-0">
                  <span className="text-[11px] text-white/60">
                    {moment(message.timestamp).format("h:mm A")}
                  </span>
                  {renderMessageStatus(message)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  
  const renderGroupMessages = (message) => {
    const isSender = message.sender._id === userInfo.id;
  
    return (
      <div className={`mt-[8px] flex ${isSender ? "justify-end" : "justify-start"}`}>
        {!isSender && (
          <div className="mr-[8px]">
            <Avatar className="h-[32px] w-[32px] rounded-full overflow-hidden">
              {message.sender.image ? (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black"
                />
              ) : (
                <AvatarFallback
                  className={`uppercase h-[32px] w-[32px] text-[14px] flex items-center justify-center rounded-full ${getColor(
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
  
        <div className="flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[45%]">
          {!isSender && (
            <span className="text-[13px] text-white/60 mb-[2px]">
              {`${message.sender.firstName} ${message.sender.lastName}`}
            </span>
          )}
  
          {message.messageType === "text" && (
            <div
              className={`${
                isSender
                  ? "bg-[#79227c] text-white rounded-[7.5px] rounded-tr-none"
                  : "bg-[#202C33] text-white rounded-[7.5px] rounded-tl-none"
              } inline-block px-[6px] py-[4px] my-[4px] w-full relative select-text`}
            >
              <div className="min-w-[60px]">
                <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] pr-[52px] break-words [user-select:text] [&::selection]:bg-[#79227c]/30 [&::selection]:text-white">{message.content}</p>
                <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                  <span className="text-[11px] text-white/60">
                    {moment(message.timestamp).format("h:mm A")}
                  </span>
                  {renderMessageStatus(message)}
                </div>
              </div>
            </div>
          )}
  
          {message.messageType === "file" && message.fileUrl && (
            <div
              className={`${
                isSender 
                  ? "bg-[#79227c] text-white/80"
                  : "bg-[#202C33] text-white/90"
              }
              inline-block p-[6px] rounded-[7.5px] my-[4px] w-full relative`}
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
                    className="rounded-[4px] w-full h-auto"
                  />
                  <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                    <span className="text-[11px] text-white/60">
                      {moment(message.timestamp).format("h:mm A")}
                    </span>
                    {renderMessageStatus(message)}
                  </div>
                </div>
              ) : checkIfVideo(message.fileUrl) ? (
                <div
                  className="relative"
                  onClick={() => {
                    setShowVideo(true);
                    setVideoURL(message.fileUrl);
                  }}
                >
                  <video
                    src={`${HOST}/${message.fileUrl}`}
                    className="rounded-[4px] w-full h-auto"
                  />
                  <FaPlay className="absolute inset-0 m-auto text-white text-3xl bg-black/50 p-3 rounded-full cursor-pointer" />
                  <div className="flex items-center justify-end gap-[2px] mt-[2px]">
                    <span className="text-[11px] text-white/60">
                      {moment(message.timestamp).format("h:mm A")}
                    </span>
                    {renderMessageStatus(message)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-[12px] min-w-[200px]">
                  <span className="text-white/80 bg-black/20 rounded-full flex flex-col items-center justify-center w-[48px] h-[48px] shrink-0">
                    <MdFolderZip className="text-[24px]" />
                    {fileSizes[message.fileUrl] && (
                      <p className="text-white text-[10px] mt-[2px]">
                        {fileSizes[message.fileUrl]}
                      </p>
                    )}
                  </span>

                  <span className="text-[14.2px] truncate max-w-[120px]">
                    {truncateMiddle(message.fileUrl.split("/").pop(), 15)}
                  </span>

                  <div className="flex items-center shrink-0">
                    <button
                      className={`relative p-[8px] text-[20px] rounded-[4px] cursor-pointer transition-all duration-300 ${
                        isDownloading
                          ? "bg-transparent"
                          : "bg-black/20 hover:bg-black/30"
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
                  <div className="flex items-center gap-[2px] shrink-0">
                    <span className="text-[11px] text-white/60">
                      {moment(message.timestamp).format("h:mm A")}
                    </span>
                    {renderMessageStatus(message)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full relative max-w-[1600px] mx-auto"
    >
      {renderMessages()}
      <div ref={scrollRef} className="h-1" />
      {showImage && (
  <div className="fixed z-[1000] top-0 left-0 h-screen w-screen flex items-center justify-center backdrop-blur-lg flex-col p-4 sm:p-6 md:p-8">
    <div className="max-w-full max-h-[80vh] w-auto h-auto">
      <img
        src={`${HOST}/${imageURL}`}
        className="max-w-full max-h-[80vh] object-contain transition-transform duration-300 ease-in-out transform hover:scale-105 cursor-zoom-in rounded-lg shadow-lg"
        alt="Preview"
      />
    </div>
    <div className="flex gap-5 fixed top-4 right-4 sm:top-6 sm:right-6">
      <button
        className="bg-black/40 p-3 text-xl rounded-full hover:bg-black/60 transition"
        onClick={() => downloadFile(imageURL)}
      >
        <IoDownload />
      </button>
      <button
        className="bg-black/40 p-3 text-xl rounded-full hover:bg-black/60 transition"
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
