import { useAppStore } from '@/store'
import { HOST } from '@/utils/constants'
import{createContext, useContext, useEffect, useRef} from 'react'
import { io } from 'socket.io-client'

const SocketConnect = createContext(null)


export const useSocket = () =>{
    return useContext(SocketConnect)
}

export const  SocketProvider = ({children})=>{
    const socket = useRef()
    const {userInfo} = useAppStore()


    useEffect(()=>{
        if(userInfo){
            socket.current = io(HOST, {withCredentials:true, query: {userId: userInfo.id},})
            socket.current.on("connect", () =>  {
                console.log("Connected to socket io server");
                
            })

            const handleRecieveMessage = (message) =>{
                const {selectedChatData, selectedChatType, addMessage, addContactsInDMContacts} = useAppStore.getState()
                if(selectedChatType !== undefined && selectedChatData._id === message.sender._id || selectedChatData._id === message.recipient._id){
                 
                    addMessage(message)
                }
                addContactsInDMContacts(message)
            }

            const handleRecieveGroupMessage = (message)=>{
                const {selectedChatData, selectedChatType, addMessage, addGroupInGroupList} = useAppStore.getState()
                if(selectedChatType !== undefined && selectedChatData._id === message.groupId){
                    
                    addMessage(message)
                }
                addGroupInGroupList(message)
            }

            socket.current.on("recieveMessage",handleRecieveMessage)
            socket.current.on("recieve-group-message",handleRecieveGroupMessage)

            return () => {
                socket.current.disconnect()
            }
        }
    },[userInfo])

    return (
        <SocketConnect.Provider value={socket.current}>
            {children}
        </SocketConnect.Provider>
    )
}