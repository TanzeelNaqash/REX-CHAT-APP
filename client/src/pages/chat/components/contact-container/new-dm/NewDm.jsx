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
            <Dialog open={openNewContactModal} onOpenChange={setopenNewContactModal} >

                <DialogContent className="bg-[#181920] text-white border-none w-[400px] h-[400px] flex flex-col rounded-xl">
                    <DialogHeader>
                        <DialogTitle> Please Select a Contact</DialogTitle>
                        <DialogDescription>

                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Input placeholder="Search Contact" className="rounded-full bg-[#2c2e3b] border-none placeholder:text-[#adaaaa]" onChange={(e) => searchContacts(e.target.value)} />
                    </div>
                    {
                        searchedContacts.length > 0 && (

                     
                    <ScrollArea className=" h-[250px]">
                        <div className='flex flex-col gap-5'>
                            {searchedContacts.map((contact) => (
                                <div key={contact.id} className='flexx gap-3 items-center cursor-pointer' onClick={()=>SelectNewContact(contact)}>

                                    <div className='w-12 h-12 relative'>
                                        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                                            {contact.image ? (
                                                <AvatarImage src={`${HOST}/${contact.image}`} alt="profile" className="object-cover w-full h-full bg-black" />
                                            ) : (
                                                <div className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(contact.color)}`}>
                                                    {contact.firstName
                                                        ? contact.firstName.split('').shift()
                                                        : contact.email.split('').shift()}
                                                </div>
                                            )}
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col">
                                        <span> {
                                            contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : ""
                                        }</span>
                                        <span className='text-xs'>{contact.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>   
                    )}
                    {searchedContacts.length <= 0 && (
    <div className='flex-1 md:flex flex-col mt-5 md:mt-0 justify-center items-center  duration-1000 transition-all'>
        <Lottie isClickToPauseDisabled={true} height={150} width={150} options={animationDefaultOptions} />
        <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-5 lg:text-2xl text-xl transition-all duration-300 text-center">
            <h3 className='poppins-medium'> Search for
                <span className='text-purple-500'> Contacts</span>
                <span className='text-purple-500'>.</span>
            </h3>
        </div>
    </div>
)}

                </DialogContent>
            </Dialog>


        </>
    )
}

export default NewDm
