import { useSocket } from '@/connect/SocketConnect'
import { apiClient } from '@/lib/api-client'
import { useAppStore } from '@/store'
import { UPLOAD_FILE_ROUTE } from '@/utils/constants'
import EmojiPicker from 'emoji-picker-react'
import { useEffect, useRef, useState } from 'react'
import { GrAttachment } from 'react-icons/gr'
import { IoSend } from 'react-icons/io5'
import { RiEmojiStickerLine } from 'react-icons/ri'
import { BsFileImage, BsFillCameraVideoFill, BsFileText } from 'react-icons/bs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { toast } from 'sonner'

const MessageBar = () => {
  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState(null);
  const socket = useSocket()
  const { selectedChatType, selectedChatData, userInfo, setIsUploading, setFileUploadProgress, setShouldRefreshContacts } = useAppStore()
  const emojiRef = useRef()
  const fileInputRef = useRef()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  useEffect(() => {
    function handleClickClose(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickClose)
    return () => {
      document.removeEventListener("mousedown", handleClickClose)
    }
  }, [emojiRef])

  const handleEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji)
  }

  const handleSendMessage = async () => {
    if (!socket) {
      console.error("Socket is not initialized");
      return;
    }
  
    const trimmedMessage = message.trim(); 
  
    if (!trimmedMessage) return; 
  
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: trimmedMessage, 
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (selectedChatType === "group") {
      socket.emit("send-group-message", {
        sender: userInfo.id,
        content: trimmedMessage, 
        groupId: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      })
    }
  
    setMessage(""); 
    setShouldRefreshContacts(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);
  
    if (!socket || !selectedChatData) return;
  
    const recipientId = selectedChatData._id;
    
    socket.emit("typing", { recipient: recipientId });
  
    if (typingTimeout) clearTimeout(typingTimeout);
  
    const newTimeout = setTimeout(() => {
      socket.emit("stopTyping", { recipient: recipientId });
    }, 2000);
  
    setTypingTimeout(newTimeout);
  };

  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const MAX_FILE_SIZE = 15 * 1024 * 1024;
  
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File too large. Please choose a file under 15MB.");
          return;
        }
  
        const formData = new FormData();
        formData.append("file", file);
        setIsUploading(true);
  
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (data) => {
            setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
          },
        });
  
        setIsUploading(false);
  
        if (response.status === 200 && response.data) {
          toast.success("File uploaded successfully!");
  
          const messagePayload = {
            sender: userInfo.id,
            content: undefined,
            messageType: "file",
            fileUrl: response.data.filePath,
          };
  
          if (selectedChatType === "contact") {
            messagePayload.recipient = selectedChatData._id;
            socket.emit("sendMessage", messagePayload);
          } else if (selectedChatType === "group") {
            messagePayload.groupId = selectedChatData._id;
            socket.emit("send-group-message", messagePayload);
          }
        }
      }
    } catch (error) {
      setIsUploading(false);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong while uploading the file.");
      }
      console.error(error);
    }
  };
  
  return (
    <div className='min-h-[70px] bg-[#1c1d25] flex items-center px-4 py-3 gap-3 w-full'>
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 bg-[#2a2b33] rounded-2xl items-center gap-3 px-4 py-2.5 shadow-sm flex">
          <input
            type="text"
            placeholder="Message..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className='flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base'
          />

          <Popover>
            <PopoverTrigger asChild>
              <button className='text-neutral-400 hover:text-white transition-all duration-300 p-2 hover:bg-[#3a3b43] rounded-full'>
                <GrAttachment className='text-xl' />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-[#1e1d1d] p-3 bottom-14 right-0 sm:right-[-35px] absolute rounded-xl w-32 sm:w-36 border border-[#2a2b33] shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: BsFileImage, label: "Image", accept: "image/*" },
                  { Icon: BsFillCameraVideoFill, label: "Video", accept: "video/*" },
                  { Icon: BsFileText, label: "Doc", accept: "application/*" },
                  { Icon: GrAttachment, label: "Other", accept: "*/*" },
                ].map(({ Icon, label, accept }) => (
                  <div key={label} className="flex flex-col items-center text-center cursor-pointer group" onClick={() => { fileInputRef.current.accept = accept; fileInputRef.current.click(); }}>
                    <div className="bg-[#2a2b33] p-2.5 mb-1.5 text-white group-hover:bg-[#8417ff] transition-all rounded-xl">
                      <Icon className="text-lg" />
                    </div>
                    <p className="text-white text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative">
            <button className='text-neutral-400 hover:text-white transition-all duration-300 p-2 hover:bg-[#3a3b43] rounded-full' onClick={() => setEmojiPickerOpen(true)}>
              <RiEmojiStickerLine className='text-xl' />
            </button>
            <div
              className="fixed bottom-[5rem] left-4 sm:left-auto sm:right-4 w-[300px] sm:w-[350px] max-w-[90%] z-50"
              ref={emojiRef}
            >
              <EmojiPicker
                theme="dark"
                open={emojiPickerOpen}
                onEmojiClick={handleEmoji}
                autoFocusSearch={false}
                style={{ width: "100%", minWidth: "300px", maxWidth: "350px" }}
              />
            </div>
          </div>
        </div>

        <button
          className={`bg-[#8417ff] flex rounded-full justify-center items-center p-4
            transition-all duration-300 ${!message.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-[#741bda] cursor-pointer"}`}
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <IoSend className='text-lg' />
        </button>
      </div>

      <input type="file" className="hidden" ref={fileInputRef} onChange={handleAttachmentChange} />
    </div>
  )
}

export default MessageBar