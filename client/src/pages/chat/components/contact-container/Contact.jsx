import  { useEffect } from 'react'
import ProfileInfo from './components/profile-info/ProfileInfo'
import NewDm from './new-dm/NewDm'
import { apiClient } from '@/lib/api-client'
import { GET_DM_CONTACTS_ROUTE, GET_USER_GROUPS_ROUTE } from '@/utils/constants'
import { useAppStore } from '@/store'
import ContactList from '@/components/ContactList'
import CreateGroup from './components/create-group/CreateGroup'

const Contact = () => {
    const { directMessagesContacts, setdirectMessagesContacts, groups, setGroups } = useAppStore()

    useEffect(() => {
        const controller = new AbortController();
    
        const getContacts = async () => {
            try {
                const response = await apiClient.get(GET_DM_CONTACTS_ROUTE, { 
                    withCredentials: true, 
                    signal: controller.signal
                });
                if (response.data.contacts) {
                    setdirectMessagesContacts(response.data.contacts);
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching contacts:", error);
                }
            }
        };
    
        const getGroups = async () => {
            try {
                const response = await apiClient.get(GET_USER_GROUPS_ROUTE, { 
                    withCredentials: true, 
                    signal: controller.signal
                });
                if (response.data.groups) {
                    setGroups(response.data.groups);
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching groups:", error);
                }
            }
        };
    
        getContacts();
        getGroups();
    
        const interval = setInterval(() => {
            getContacts();
            getGroups();
        }, 5000);
    
        return () => {
            clearInterval(interval);
            controller.abort(); 
        };
    }, []);
    
    
    return (
        <div className='relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full'>
            <div className="pt-3">
                <Logo />
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10">
                    <Title text='Contacts' />
                    <NewDm />
                </div>
                <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
                    <ContactList contacts={directMessagesContacts} />
                </div>
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10">
                    <Title text='Groups' />
                    <CreateGroup />
                </div>
                <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
                    <ContactList contacts={groups} isgroup={true}/>
                </div>
            </div>
            <ProfileInfo />
        </div>
    )
}

export default Contact


const Logo = () =>{
    return(
        <div className="flex p-5 justify-start items-center gap-2">
         <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0A0A0A"/>
      <stop offset="100%" stop-color="#1A1A2E"/>
    </radialGradient>
    <radialGradient id="softGlow" cx="50%" cy="50%" r="50%">
      <stop offset="30%" stop-color="#FF00FF" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#00BFFF" stop-opacity="0.2"/>
    </radialGradient>
    <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF00FF"/>
      <stop offset="100%" stop-color="#00BFFF"/>
    </linearGradient>
  </defs>
  

  <circle cx="50" cy="50" r="30" fill="url(#glow)" stroke="url(#edgeGlow)" stroke-width="1"/>
  
 
  <rect x="30" y="40" width="40" height="18" rx="9" fill="none" stroke="url(#edgeGlow)" stroke-width="1"/>
  

  <rect x="40" y="44" width="4" height="10" rx="3" fill="white"/>
  <rect x="56" y="44" width="4" height="10" rx="3" fill="white"/>
  

  <text x="100" y="60" font-size="25" font-weight="bold" fill="#fff" font-family="Arial">REX</text>
</svg>



        </div>
    )
}

const Title = ({text})=>{
    return(
        <h6 className='uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm'>{text}</h6>
    )
}