import ChatHeader from './components/chat-header/ChatHeader'
import MessageBar from './components/message-bar/MessageBar'
import MessageContainer from './components/message-container/MessageContainer'
import { useAppStore } from '@/store'
import { HOST } from '@/utils/constants'

const ChatContainer = () => {
  const { userInfo } = useAppStore();

  return (
    <div className='fixed top-0 h-[100vh] w-[100vw] rounded-none bg-[#1c1d21] flex flex-col md:static md:flex-1 md:h-auto md:rounded-lg md:shadow-lg'>
      <ChatHeader/>
      <div 
        className='flex-1 overflow-y-auto relative pb-[70px] md:pb-0 '
        style={{
          backgroundImage: userInfo.backgroundImage ? `url('${HOST}/${userInfo.backgroundImage}')` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundBlendMode: "overlay",
          
        }}
      >
        <MessageContainer/>
      </div>
      <div className='fixed bottom-0 left-0 right-0 w-full bg-[#1c1d21] border-t border-[#2a2b33] md:static'>
        <MessageBar/>
      </div>
    </div>
  )
}

export default ChatContainer
