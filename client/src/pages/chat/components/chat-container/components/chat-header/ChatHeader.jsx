import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { ADD_BACKGROUND_IMAGE_ROUTE, HOST, REMOVE_BACKGROUND_IMAGE_ROUTE } from "@/utils/constants";
import { FaArrowLeft } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useSocket } from "@/connect/SocketConnect";
import { ImageIcon, Trash, } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { FiPhone, FiVideo } from "react-icons/fi";

import CallButtons from "@/pages/chat/CallButtons";

const ChatHeader = () => {
    const { 
        closeChat, 
        selectedChatData, 
        selectedChatType, 
        userInfo, 
        setUserInfo,
        onlineUsers
    } = useAppStore();
    
    const socket = useSocket();
    const [isTyping, setIsTyping] = useState(false);
    const fileInputRef = useRef(null);
    const [lastSeen, setLastSeen] = useState(null);

    // Check if the current chat user is online
    const isOnline = selectedChatType === "contact" && onlineUsers?.includes(selectedChatData?._id);

    // Get last seen time when chat user changes
    useEffect(() => {
        if (selectedChatType === "contact" && selectedChatData?._id && socket) {
            console.log('Requesting last seen for user:', selectedChatData._id);
            socket.emit("get-last-seen", { userId: selectedChatData._id });
        }
    }, [selectedChatType, selectedChatData?._id, socket]);

    // Listen for last seen updates
    useEffect(() => {
        if (!socket) return;

        const handleLastSeen = ({ userId, lastSeen }) => {
            console.log('Received last seen update:', { userId, lastSeen });
            if (userId === selectedChatData?._id) {
                console.log('Setting last seen for current user:', lastSeen);
                // Only update lastSeen if user is offline
                if (!isOnline) {
                    setLastSeen(lastSeen);
                } else {
                    setLastSeen(null);
                }
            }
        };

        socket.on("last-seen", handleLastSeen);

        return () => {
            socket.off("last-seen", handleLastSeen);
        };
    }, [socket, selectedChatData?._id, isOnline]);

    // Update lastSeen when online status changes
    useEffect(() => {
        if (isOnline) {
            setLastSeen(null);
        }
    }, [isOnline]);
   
    useEffect(() => {
      if (!selectedChatData?._id || !socket) return;
  
      const handleTyping = ({ sender }) => {
          if (sender === selectedChatData._id) setIsTyping(true);
      };
  
      const handleStopTyping = ({ sender }) => {
          if (sender === selectedChatData._id) setIsTyping(false);
      };
  
      socket.on("typing", handleTyping);
      socket.on("stopTyping", handleStopTyping);
  
      return () => {
          socket.off("typing", handleTyping);
          socket.off("stopTyping", handleStopTyping);
      };
  }, [selectedChatData, socket]);
  
    if (!socket || !selectedChatData) {
      return null; 
  }
  
   
    
    const handleBackgroundImageChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File too large. Please choose a file under 15MB.");
                return;
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type. Only JPEG, PNG, WebP and SVG files are allowed.");
                return;
            }
            
            const formData = new FormData();
            formData.append("background-image", file);
    
            try {
                const response = await apiClient.post(
                    ADD_BACKGROUND_IMAGE_ROUTE,
                    formData,
                    { 
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
    
                if (response.status === 200 && response.data.backgroundImage) {
                    setUserInfo({ ...userInfo, backgroundImage: response.data.backgroundImage });
                    toast.success("Background image has been Updated!");
                }
            } catch (error) {
                console.error("Upload failed:", error);
                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error("Failed to upload background image. Please try again.");
                }
            }
        }
    };
    
    const handleDeleteBackgroundImage = async () => {
        try {
            const response = await apiClient.delete(REMOVE_BACKGROUND_IMAGE_ROUTE, {
                withCredentials: true,
            });
            if (response.status === 200) {
                setUserInfo({ ...userInfo, backgroundImage: null });
                toast.success("Background Image Removed!");
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to remove background image");
        }
    };

    
   

    return (
        <div className="h-[10vh] border-b-2 rounded-none border-[#2f303b] flex items-center justify-between px-5 relative">
            <div className="flex gap-5 items-center">
                <button className="text-white focus:outline-none transition-all" onClick={closeChat}>
                    <FaArrowLeft className="text-xl" />
                </button>
                
                <div className="flex gap-3 items-center">
                    {selectedChatType === "contact" ? (
                        <div className="relative">
                        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                            {selectedChatData?.image ? (
                                <AvatarImage 
                                    src={`${HOST}/${selectedChatData.image}`} 
                                    alt="profile" 
                                    className="object-cover w-full h-full bg-black" 
                                />
                            ) : (
                                <div className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(selectedChatData?.color)}`}>
                                    {selectedChatData?.firstName ? selectedChatData.firstName.charAt(0) : selectedChatData?.email?.charAt(0) || "?"}
                                </div>
                            )}
                        </Avatar>
                            {selectedChatType === "contact" && (
                                <span 
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1c1d21] ${
                                        isOnline ? "bg-green-500" : "bg-gray-500"
                                    }`}
                                    title={isOnline ? "Online" : "Offline"}
                                />
                            )}
                        </div>
                    ) : (
                        <div className='bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full'>
                            {(selectedChatData.name && selectedChatData.name.length > 0)
                                ? selectedChatData.name.charAt(0) 
                                : "#" 
                            }
                        </div>
                    )}
                    
                    <div>
                        {selectedChatType === "contact" && selectedChatData?.firstName
                            ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                            : selectedChatData?.email || selectedChatData.name || "Unknown"}
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            {isTyping ? "Typing..." : ""}
                            {selectedChatType === "contact" && !isTyping && (
                                <span className="text-xs">
                                    {isOnline ? "Online" : lastSeen ? `Last seen ${lastSeen}` : "Offline"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
           
            <div className="flex items-center gap-4">
                {/* Call Buttons */}
                {selectedChatType === "contact" && (
                    <div className="flex items-center gap-4">
                     <CallButtons 
          recipientId={selectedChatData?._id} 
        />
                    </div>
                )}
                
                {selectedChatType === "group" && (
                    <div className="flex items-center gap-4">
                       <CallButtons disabled={true}
          recipientId={selectedChatData?._id} 
        />
                    </div>
                )}
                
                {/* Dropdown Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="text-white text-xl focus:outline-none">
                        <HiDotsVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="bg-gray-800 text-white rounded-md p-2 mt-2 w-full border-none"
                    >
                        {!userInfo.backgroundImage ? (
                            <DropdownMenuItem
                                onClick={() => fileInputRef.current.click()}
                                className="hover:!text-purple-500 hover:!bg-transparent text-sm"
                            >
                                <ImageIcon /> Upload Background Image
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={handleDeleteBackgroundImage}
                                className="hover:!text-purple-500 hover:!bg-transparent text-sm"
                            >
                                <Trash /> Remove Background Image
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".png, .jpg, .jpeg, .svg, .webp" 
                onChange={handleBackgroundImageChange} 
            />
        </div>
    );
};

export default ChatHeader;
