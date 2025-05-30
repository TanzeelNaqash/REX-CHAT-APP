import { useAppStore } from "@/store"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import Contact from "./components/contact-container/Contact"
import EmptyChat from "./components/empty-chat-container/EmptyChat"
import ChatContainer from "./components/chat-container/chatContainer"

const Chat = () => {
 
  const { userInfo, selectedChatType, selectedChatData,  isUploading,
    isDownloading,
    fileUploadProgress,
    fileDownloadProgress, } = useAppStore()
  const navigate = useNavigate()
  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast('Please setup your profile first!')
      navigate('/profile')
    }
  }, [userInfo, navigate])
  return (
    <div className="flex h-[100vh] text-white overflow-hidden">
      {
        isUploading && (
          <div className="h-[100vh] w-[100vw] fixed top-0 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-xl">
            <h5 className="text-5xl animate-pulse">Uploading File</h5>
            {fileUploadProgress}%
          </div>
        )
      }
      {
        isDownloading && (
          <div className="h-[100vh] w-[100vw] fixed top-0 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-xl">
            <h5 className="text-5xl animate-pulse">Downloading File</h5>
            {fileDownloadProgress}%
          </div>
        )
      }
      <Contact />
      {
        selectedChatType === undefined ? <EmptyChat /> : <ChatContainer />
      }

    </div>
  )
}

export default Chat
