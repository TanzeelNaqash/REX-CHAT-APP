import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { apiClient } from '@/lib/api-client'
import { animationDefaultOptions, getColor } from '@/lib/utils'
import { HOST, SEARCH_CONTACT_ROUTE } from '@/utils/constants'
import React, { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import Lottie from 'react-lottie'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/store'
const NewDm = () => {
    const {setSelectedChatType, setSelectedChatData} = useAppStore()
    const [openNewContactModal, setopenNewContactModal] = useState(false)
    const [searchedContacts, setsearchedContacts] = useState([])
    const searchContacts = async (searchTerm) => {
        try {
            if (searchTerm.length > 0) {
                const response = await apiClient.post(SEARCH_CONTACT_ROUTE, { searchTerm }, { withCredentials: true });
                if (response.status === 200 && response.data.contacts) {
                    setsearchedContacts(response.data.contacts);
                }
            } else {
                setsearchedContacts([]);
            }
        } catch (error) {
            console.log(error);
        }
    };
    

    const SelectNewContact = (contact) =>{
        setopenNewContactModal(false)
        setSelectedChatType('contact')
        setSelectedChatData(contact)
        setsearchedContacts([])
    }
    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <FaPlus className='text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300' onClick={() => setopenNewContactModal(true)} />
                    </TooltipTrigger>
                    <TooltipContent className='bg-[#1c1b1e] border-none text-white rounded-[6px] p-3 mb-2 '>
                        Select New Contact
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
           <Dialog open={openNewContactModal} onOpenChange={setopenNewContactModal}>
    <DialogContent className="bg-[#181920] text-white border-none w-full max-w-md sm:max-w-lg md:max-w-lg lg:max-w-lg h-auto sm:h-[400px] flex flex-col rounded-xl p-4 sm:p-6">
        <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Please Select a Contact</DialogTitle>
        </DialogHeader>
        
        <div>
            <Input
                placeholder="Search Contact"
                className="rounded-full bg-[#2c2e3b] border-none placeholder:text-[#adaaaa] w-full"
                onChange={(e) => searchContacts(e.target.value)}
            />
        </div>
        
        {searchedContacts.length > 0 ? (
            <ScrollArea className="h-[250px] sm:h-[300px] overflow-y-auto">
                <div className='flex flex-col gap-5 p-2'>
                    {searchedContacts.map((contact) => (
                        <div key={contact.id} className='flex items-center gap-3 cursor-pointer p-2 rounded-lg transition' onClick={() => SelectNewContact(contact)}>
                            <div className='w-12 h-12 relative'>
                                <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                                    {contact.image ? (
                                        <AvatarImage src={`${HOST}/${contact.image}`} alt="profile" className="object-cover w-full h-full bg-black" />
                                    ) : (
                                        <div className={`uppercase h-12 w-12 text-lg border flex items-center justify-center rounded-full ${getColor(contact.color)}`}>
                                            {contact.firstName ? contact.firstName[0] : contact.email[0]}
                                        </div>
                                    )}
                                </Avatar>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-medium">{contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : ""}</span>
                                <span className='text-xs text-gray-400'>{contact.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <div className='flex flex-col justify-center items-center mt-5 sm:mt-10'>
                <Lottie isClickToPauseDisabled={true} height={120} width={120} options={animationDefaultOptions} />
                <div className="text-opacity-80 text-white flex flex-col gap-2 items-center mt-4 text-center">
                    <h3 className='text-lg sm:text-xl font-medium'>Search for <span className='text-purple-500'>Contacts</span><span className='text-purple-500'>.</span></h3>
                </div>
            </div>
        )}
    </DialogContent>
</Dialog>


        </>
    )
}

export default NewDm
