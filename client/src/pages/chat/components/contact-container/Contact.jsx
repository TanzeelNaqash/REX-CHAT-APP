import React, { useEffect } from 'react'
import ProfileInfo from './components/profile-info/ProfileInfo'
import NewDm from './new-dm/NewDm'
import { apiClient } from '@/lib/api-client'
import { GET_DM_CONTACTS_ROUTE } from '@/utils/constants'
import { useAppStore } from '@/store'
import ContactList from '@/components/ContactList'

const Contact = () => {
    const {directMessagesContacts, setdirectMessagesContacts} = useAppStore()
    useEffect(()=>{
        const  getContacts = async () => {
            const response = await apiClient.get(GET_DM_CONTACTS_ROUTE, {withCredentials: true})
            if(response.data.contacts){
                setdirectMessagesContacts(response.data.contacts)
                
            }
        }
        getContacts()
    },[])
  return (
    <div className='relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full'>
      <div className="pt-3">
        <Logo/>
    </div>
    <div className="my-5">
        <div className="flex items-center justify-between pr-10">
            <Title text='Contacts'/>
            <NewDm/>
        </div>
        <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden ">
            <ContactList contacts={directMessagesContacts}/>
        </div>
    </div>
    <div className="my-5">
        <div className="flex items-center justify-between pr-10">
            <Title text='Groups'/>
        </div>
    </div>
    <ProfileInfo/>
    </div>
    
  )
}

export default Contact

const Logo = () =>{
    return(
        <div className="flex p-5 justify-start items-center gap-2">
            <svg width="128" height="64" viewBox="0 0 128 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 30 L30 10 L40 30 L50 10 L60 30" stroke="#8338ec" stroke-width="4" fill="none"/>
  <text x="65" y="40" font-size="30" font-weight="bold" fill="#fff" font-family="Arial">REX</text>
</svg>
        </div>
    )
}

const Title = ({text})=>{
    return(
        <h6 className='uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm'>{text}</h6>
    )
}