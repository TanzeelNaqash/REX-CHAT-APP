import { useSocket } from '@/connect/SocketConnect'
import { apiClient } from '@/lib/api-client'
import { useAppStore } from '@/store'
import { UPLOAD_FILE_ROUTE } from '@/utils/constants'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useRef, useState } from 'react'
import { GrAttachment } from 'react-icons/gr'
import { IoSend } from 'react-icons/io5'
import { RiEmojiStickerLine } from 'react-icons/ri'
import { BsFileImage, BsFillCameraVideoFill, BsFileText } from 'react-icons/bs' // Importing icons
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

const MessageBar = () => {
  const [message, setMessage] = useState('')
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
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    }
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
          }
        }
      }
    } catch (error) {
      setIsUploading(false)
      console.log(error);
    }
  }

  return (
    <div className='h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6'>
      <div className="flex-1 flex bg-[#2a2b33] rounded-full items-center gap-5 pr-5">
        <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className='flex-1 p-5 bg-transparent rounded-md poppins-medium focus:border-none focus:outline-none' />
        
        {/* Attachment Icon */}
        <Popover>
          <PopoverTrigger asChild>
            <button className='text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all'>
              <GrAttachment className='text-xl' />
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#1e1d1d] p-3 bottom-12 right-[-35px] absolute rounded-xl w-30 border-none">
            <div className="flex flex-col gap-3">
              {/* Image Option */}
              <div 
                onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}
                className="flex flex-col items-center text-center cursor-pointer">
                <div className="bg-[#2a2b33] p-3 mb-1 text-white hover:bg-[#8417ff] transition-all rounded-xl">
                  <BsFileImage className="text-2xl" />
                </div>
                <p className="text-white text-xs">Image</p>
              </div>

              {/* Video Option */}
              <div 
                onClick={() => { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }}
                className="flex flex-col items-center text-center cursor-pointer ">
                <div className="bg-[#2a2b33] p-3 mb-1 text-white hover:bg-[#8417ff] transition-all rounded-xl">
                  <BsFillCameraVideoFill className="text-2xl" />
                </div>
                <p className="text-white text-xs">Video</p>
              </div>

              {/* Document Option */}
              <div 
                onClick={() => { fileInputRef.current.accept = 'application/*'; fileInputRef.current.click(); }}
                className="flex flex-col items-center text-center cursor-pointer">
                <div className="bg-[#2a2b33] p-3 rounded-xl mb-1 text-white hover:bg-[#8417ff] transition-all">
                  <BsFileText className="text-2xl" />
                </div>
                <p className="text-white text-xs">Document</p>
              </div>

              {/* Other Option */}
              <div 
                onClick={() => { fileInputRef.current.accept = '*/*'; fileInputRef.current.click(); }}
                className="flex flex-col items-center text-center cursor-pointer">
                <div className="bg-[#2a2b33] p-3 rounded-xl mb-1 text-white hover:bg-[#8417ff] transition-all">
                  <GrAttachment className="text-2xl" />
                </div>
                <p className="text-white text-xs">Other</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Emoji Picker */}
        <div className="relative">
          <button className='text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all' onClick={() => setEmojiPickerOpen(true)}>
            <RiEmojiStickerLine className='text-xl' />
          </button>
          <div className="absolute bottom-16 right-0" ref={emojiRef}>
            <EmojiPicker theme='dark' open={emojiPickerOpen} onEmojiClick={handleEmoji} autoFocusSearch={false} />
          </div>
        </div>
      </div>

      {/* Send Button */}
      <button className='bg-[#8417ff] flex rounded-full justify-center items-center p-5 focus:border-none focus:outline-none hover:bg-[#741bda] focus:bg-[#741bda] focus:text-white duration-300 transition-all' onClick={handleSendMessage}>
        <IoSend className='text-xl' />
      </button>

      {/* File Input (hidden) */}
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleAttachmentChange} />
    </div>
  )
}

export default MessageBar
