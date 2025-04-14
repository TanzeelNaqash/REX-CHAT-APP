import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { ADD_BACKGROUND_IMAGE_ROUTE, HOST, REMOVE_BACKGROUND_IMAGE_ROUTE } from "@/utils/constants";
import { FaArrowLeft } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useSocket } from "@/connect/SocketConnect";
import { ImageIcon, Trash } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const ChatHeader = () => {
    const { closeChat, selectedChatData, selectedChatType , userInfo, setUserInfo} = useAppStore();
    const socket = useSocket();
    const [isTyping, setIsTyping] = useState(false);
    const [bgImage, setBgImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!selectedChatData?._id) return;

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
    

    const handleBackgroundImageChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("background-image", file);
    
            try {
                const response = await apiClient.post(
                    ADD_BACKGROUND_IMAGE_ROUTE,
                    formData,
                    { withCredentials: true }
                );
    
                console.log("Upload Response:", response); 
    
                if (response.status === 200 && response.data.backgroundImage) {
                    setUserInfo({ ...userInfo, backgroundImage: response.data.backgroundImage });
                    toast.success("Background image has been Updated!");
                }
            } catch (error) {
                console.error("Upload failed:", error);
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
         toast.success("background Image Removed!");
         setBgImage(null);
       }
     } catch (error) {
       console.log(error);
     }
   };

    return (
        <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-5 relative">
            <div className="flex gap-5 items-center">
                <button className="text-neutral-500 focus:outline-none transition-all" onClick={closeChat}>
                    <FaArrowLeft className="text-xl" />
                </button>
                <div className="flex gap-3 items-center">
                  {
                    selectedChatType === "contact" ? <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                    {selectedChatData?.image ? (
                        <AvatarImage src={`${HOST}/${selectedChatData.image}`} alt="profile" className="object-cover w-full h-full bg-black" />
                    ) : (
                        <div className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(selectedChatData?.color)}`}>
                            {selectedChatData?.firstName ? selectedChatData.firstName.charAt(0) : selectedChatData?.email?.charAt(0) || "?"}
                        </div>
                    )}
                </Avatar>:   <div className='bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full'>
            {(selectedChatData.name && selectedChatData.name.length > 0)
                ? selectedChatData.name.charAt(0) 
                    : "#" 
            }
        </div>
                  }
                    
                    <div>
                        {selectedChatType === "contact" && selectedChatData?.firstName
                            ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                            : selectedChatData?.email || selectedChatData.name || "Unknown"}
                        <div className="text-sm text-gray-400">
                            {isTyping ? "Typing..." : ""}
                        </div>
                    </div>
                </div>
            </div>

            
            <DropdownMenu>
  <DropdownMenuTrigger className="text-white text-xl focus:outline-none">
    <HiDotsVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent
    align="end"
    className=" bg-gray-800 text-white rounded-md p-2 mt-2 w-full border-none"
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


            
            <input type="file" ref={fileInputRef} className="hidden" accept=".png, .jpg, .jpeg, .svg, .webp" onChange={handleBackgroundImageChange} />
        </div>
    );
};

export default ChatHeader;
