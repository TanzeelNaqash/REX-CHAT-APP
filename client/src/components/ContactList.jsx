import { useAppStore } from '@/store'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { HOST } from '@/utils/constants'
import { getColor } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const ContactList = ({ contacts, isgroup = false, unreadCounts = {} }) => {
    const { 
        selectedChatData, 
        setSelectedChatData, 
        setSelectedChatType, 
        setSelectedChatMessages,
        recentMessages,
        userInfo
    } = useAppStore()

    const handleChatSelect = (contact) => {
        setSelectedChatData(contact)
        setSelectedChatType(isgroup ? "group" : "contact")
        if (selectedChatData && selectedChatData._id !== contact._id) {
            setSelectedChatMessages([])
        }
    }

    const formatMessage = (message, isgroup) => {
        if (!message) return '';
        
        const isCurrentUser = message.sender._id === userInfo.id;
        const prefix = isCurrentUser ? 'You: ' : '';
        
        if (message.content) {
            return prefix + message.content;
        }
        return '';
    }

    return (
        <div className="flex flex-col gap-2">
            {contacts.map((contact) => {
                const recentMessage = recentMessages[contact._id];
                const unreadCount = unreadCounts[contact._id] || 0;
                
                return (
                    <div
                        key={contact._id}
                        onClick={() => handleChatSelect(contact)}
                        className={`flex items-center gap-3 px-10 py-2 hover:bg-[#2f303b] cursor-pointer relative ${
                            selectedChatData && selectedChatData._id === contact._id 
                                ? "bg-[#8417ff] hover:bg-[#8417ff]" 
                                : ""
                        }`}
                    >
                        <Avatar className="h-10 w-10">
                            {contact.image ? (
                                <AvatarImage 
                                    src={`${HOST}/${contact.image}`} 
                                    alt="profile" 
                                    className="object-cover w-full h-full bg-black" 
                                />
                            ) : (
                                <AvatarFallback className={getColor(contact.color)}>
                                    {contact.firstName ? contact.firstName.charAt(0) : contact.name.charAt(0)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium truncate">
                                    {isgroup ? contact.name : `${contact.firstName} ${contact.lastName}`}
                                </p>
                                {recentMessage?.timestamp && (
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(recentMessage.timestamp), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">
                                {formatMessage(recentMessage, isgroup)}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#8417ff] text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-medium">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}

export default ContactList

