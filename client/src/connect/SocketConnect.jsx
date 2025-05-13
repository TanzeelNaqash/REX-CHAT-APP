import { useAppStore } from '@/store'
import { HOST } from '@/utils/constants'
import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketConnect = createContext(null)

export const useSocket = () => {
  return useContext(SocketConnect)
}

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const { 
    userInfo, 
    setOnlineUsers, 
    addMessage, 
    incrementUnreadCount,
    updateRecentMessage,
    selectedChatData,
    unreadCounts
  } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      console.log("Initializing socket with user:", userInfo.id);
      // Initialize socket connection
      socket.current = io(HOST, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        extraHeaders: {
          "Access-Control-Allow-Origin": "*"
        },
        query: { userId: userInfo.id },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.current.on("connect", () => {
        console.log("Connected to socket io server");
      });

      socket.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Clear online users when disconnected
        setOnlineUsers([]);
      });

      // Listen for online users updates
      socket.current.on("online-users", (users) => {
        console.log("Received online users:", users);
        setOnlineUsers(users);
      });

      const handleReceiveMessage = (message) => {
        console.log("Received direct message:", {
          message,
          currentUser: userInfo.id,
          sender: message.sender._id,
          selectedChat: selectedChatData?._id,
          currentUnreadCounts: unreadCounts
        });

        // Add message to chat
          addMessage(message);
        
        // Update recent message
        const chatId = message.sender._id === userInfo.id ? message.recipient._id : message.sender._id;
        console.log("Updating recent message for chat:", chatId);
        updateRecentMessage(chatId, message);
      };

      const handleReceiveGroupMessage = (message) => {
        console.log("Received group message:", {
          message,
          currentUser: userInfo.id,
          sender: message.sender._id,
          groupId: message.groupId,
          selectedChat: selectedChatData?._id,
          currentUnreadCounts: unreadCounts
        });

        // Add message to chat
          addMessage(message);
        
        // Update recent message
        console.log("Updating recent message for group:", message.groupId);
        updateRecentMessage(message.groupId, message);
      };

      // Fix typo in event names
      socket.current.on("recieveMessage", handleReceiveMessage);
      socket.current.on("recieve-group-message", handleReceiveGroupMessage);

      return () => {
        if (socket.current) {
          socket.current.disconnect();
          socket.current = null;
        }
      };
    }
  }, [userInfo, setOnlineUsers, addMessage, incrementUnreadCount, updateRecentMessage, selectedChatData, unreadCounts]);

  return (
    <SocketConnect.Provider value={socket.current}>
      {children}
    </SocketConnect.Provider>
  );
};