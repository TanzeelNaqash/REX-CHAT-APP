import { useSocket } from '@/connect/SocketConnect'
import { apiClient } from '@/lib/api-client'
import { useAppStore } from '@/store'
import { UPLOAD_FILE_ROUTE } from '@/utils/constants'
import EmojiPicker from 'emoji-picker-react'
import  { useEffect, useRef, useState } from 'react'
import { GrAttachment } from 'react-icons/gr'
import { IoSend } from 'react-icons/io5'
import { RiEmojiStickerLine } from 'react-icons/ri'
import { BsFileImage, BsFillCameraVideoFill, BsFileText } from 'react-icons/bs' // Importing icons
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

const MessageBar = () => {
  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState(null);
  const socket = useSocket()
  const { selectedChatType, selectedChatData, userInfo, setIsUploading, setFileUploadProgress } = useAppStore()
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
      
    }else if(selectedChatType=== "group"){
      socket.emit("send-group-message",{
        sender: userInfo.id,
        content: trimmedMessage, 
        groupId: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      })
    }
  
    setMessage(""); 
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
      const file = event.target.files[0]
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        setIsUploading(true)
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, { withCredentials: true,
          onUploadProgress:data=>{
            setFileUploadProgress(Math.round((100*data.loaded)/data.total))
          }
         })

        if (response.status === 200 && response.data) {
          setIsUploading(false)
          if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.filePath,
            });
          } else if(selectedChatType==="group"){
            socket.emit("send-group-message",{
              sender: userInfo.id,
              content: undefined,
              groupId: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.filePath,
            })
          }
        }
      }
    } catch (error) {
      setIsUploading(false)
      console.log(error);
    }
  }

  return (
    <div className='h-[10vh] bg-[#1c1d25] flex items-center px-4 sm:px-8 mb-4 gap-4 sm:gap-6 w-full'>
  <div className="flex-1 flex bg-[#2a2b33] rounded-full items-center mt-4 gap-3 sm:gap-5 px-3 sm:px-5 py-2 sm:py-3">
   
    <input
  type="text"
  placeholder="Message"
  value={message}
  onChange={handleInputChange} // Use new function
  className='flex-1 p-2 sm:p-3 bg-transparent rounded-md poppins-medium focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base'
/>


 
    <Popover>
      <PopoverTrigger asChild>
        <button className='text-neutral-500 hover:text-white transition-all duration-300'>
          <GrAttachment className='text-lg sm:text-xl' />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-[#1e1d1d] p-3 bottom-12 right-[-10px] sm:right-[-35px] absolute rounded-xl w-28 sm:w-32 border-none">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
         
          {[
            { Icon: BsFileImage, label: "Image", accept: "image/*" },
            { Icon: BsFillCameraVideoFill, label: "Video", accept: "video/*" },
            { Icon: BsFileText, label: "Doc", accept: "application/*" },
            { Icon: GrAttachment, label: "Other", accept: "*/*" },
          ].map(({ Icon, label, accept }) => (
            <div key={label} className="flex flex-col items-center text-center cursor-pointer" onClick={() => { fileInputRef.current.accept = accept; fileInputRef.current.click(); }}>
              <div className="bg-[#2a2b33] p-2 sm:p-3 mb-1 text-white hover:bg-[#8417ff] transition-all rounded-xl">
                <Icon className="text-lg sm:text-2xl" />
              </div>
              <p className="text-white text-xs sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>

   
    <div className="relative">
      <button className='text-neutral-500 hover:text-white transition-all duration-300' onClick={() => setEmojiPickerOpen(true)}>
        <RiEmojiStickerLine className='text-lg sm:text-xl' />
      </button>
      <div
  className="fixed bottom-[6rem] left-5 sm:left-auto sm:right-5 w-[250px] sm:w-[300px] max-w-[90%] z-50"
  ref={emojiRef}
>
  <EmojiPicker
    theme="dark"
    open={emojiPickerOpen}
    onEmojiClick={handleEmoji}
    autoFocusSearch={false}
    style={{ width: "100%", minWidth: "250px", maxWidth: "300px" }} // Prevents collapse
  />
</div>

    </div>
  </div>


  <button
  className={`bg-[#8417ff] flex rounded-full justify-center items-center mt-4 p-3 sm:p-5 
    transition-all duration-300 ${!message.trim() ? "bg-[#a383c7]/80 " : "hover:bg-[#741bda]"}`}
  onClick={handleSendMessage}
  disabled={!message.trim()} 
>
  <IoSend className='text-lg sm:text-xl' />
</button>



  <input type="file" className="hidden" ref={fileInputRef} onChange={handleAttachmentChange} />
</div>

  )
}

export default MessageBar
