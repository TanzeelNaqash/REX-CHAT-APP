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
                const {selectedChatData, selectedChatType, addMessage} = useAppStore.getState()
                if(selectedChatType !== undefined && selectedChatData._id === message.sender._id || selectedChatData._id === message.recipient._id){
                    console.log("msg rcieved", message);
                    addMessage(message)
                }
            }

            socket.current.on("recieveMessage",handleRecieveMessage)
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