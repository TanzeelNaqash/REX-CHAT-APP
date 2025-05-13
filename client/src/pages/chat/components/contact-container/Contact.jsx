import { useEffect, useCallback } from 'react'
import ProfileInfo from './components/profile-info/ProfileInfo'
import NewDm from './new-dm/NewDm'
import { apiClient } from '@/lib/api-client'
import { GET_DM_CONTACTS_ROUTE, GET_USER_GROUPS_ROUTE } from '@/utils/constants'
import { useAppStore } from '@/store'
import ContactList from '@/components/ContactList'
import CreateGroup from './components/create-group/CreateGroup'

const Contact = () => {
    const { 
        directMessagesContacts, 
        setdirectMessagesContacts, 
        groups, 
        setGroups,
        shouldRefreshContacts,
        setShouldRefreshContacts,
        unreadCounts
    } = useAppStore()

    // Create memoized fetch functions to avoid recreation on each render
    const fetchContacts = useCallback(async () => {
        try {
            const response = await apiClient.get(GET_DM_CONTACTS_ROUTE, { 
                withCredentials: true
            });
            if (response.data.contacts) {
                setdirectMessagesContacts(response.data.contacts);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    }, [setdirectMessagesContacts]);

    const fetchGroups = useCallback(async () => {
        try {
            const response = await apiClient.get(GET_USER_GROUPS_ROUTE, { 
                withCredentials: true
            });
            if (response.data.groups) {
                setGroups(response.data.groups);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    }, [setGroups]);

    // Effect for initial load and handling refresh trigger
    useEffect(() => {
        // Initial fetch on component mount
        fetchContacts();
        fetchGroups();
        
        // If shouldRefreshContacts is true, fetch data and reset flag
        if (shouldRefreshContacts) {
            fetchContacts();
            fetchGroups();
            setShouldRefreshContacts(false);
        }
    }, [fetchContacts, fetchGroups, shouldRefreshContacts, setShouldRefreshContacts]);
    
    return (
        <div className='relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] text-white bg-[#1b1c24] border-r-2 border-[#2f303b] w-full'>
            <div className="pt-3">
                <Logo />
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10 ">
                    <Title text='Contacts' />
                    <NewDm onNewDmCreated={() => setShouldRefreshContacts(true)} />
                </div>
                <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
                    <ContactList 
                        contacts={directMessagesContacts} 
                        unreadCounts={unreadCounts}
                    />
                </div>
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10">
                    <Title text='Groups' />
                    <CreateGroup onGroupCreated={() => setShouldRefreshContacts(true)} />
                </div>
                <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
                    <ContactList 
                        contacts={groups} 
                        isgroup={true}
                        unreadCounts={unreadCounts}
                    />
                </div>
            </div>
            <ProfileInfo />
        </div>
    )
}

export default Contact

const Logo = () => {
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

const Title = ({text}) => {
    return(
        <h6 className='uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm'>{text}</h6>
    )
}