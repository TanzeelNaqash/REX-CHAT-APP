import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiClient } from "@/lib/api-client";
import { CREATE_GROUP_ROUTE, GET_ALL_CONTACTS_ROUTE } from "@/utils/constants";
import { useEffect, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { getColor } from "@/lib/utils";

const CreateGroup = () => {
  const { setSelectedChatType, setSelectedChatData, addGroup } = useAppStore();
  const [newGroupModal, setNewGroupModal] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const getData = async () => {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTE, {
        withCredentials: true,
      });
      setAllContacts(response.data.contacts);
    };
    getData();
  }, []);

  const createGroup = async () => {
    try {
      if (groupName.length > 0 && selectedContacts.length > 0) {
        const response = await apiClient.post(
            CREATE_GROUP_ROUTE,
            {
                name: groupName,
                members: selectedContacts.map((contact) => contact.value),
            },
            { withCredentials: true } 
        );
        
        if(response.status === 201){
            setGroupName("")
            setSelectedContacts([])
            setNewGroupModal(false)
            addGroup(response.data.group)
          }
      }
     
    } catch (error) {
      console.log({ error });
    }
  };
  const toggleSelect = (contact) => {
    setSelectedContacts((prev) =>
      prev.some((c) => c.value === contact.value)
        ? prev.filter((c) => c.value !== contact.value)
        : [...prev, contact]
    );
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => setNewGroupModal(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white rounded-[6px] p-3 mb-2 ">
            Create New Group
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={newGroupModal} onOpenChange={setNewGroupModal}>
        <DialogContent className="bg-[#181920] text-white border-none w-full max-w-md sm:max-w-lg md:max-w-lg lg:max-w-lg h-auto sm:h-[400px] flex flex-col rounded-xl p-4 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle>New Group</DialogTitle>
            <DialogDescription>Add members</DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Group Name"
            className="rounded-lg bg-[#2c2e3b] border-none placeholder:text-[#adaaaa]"
            onChange={(e) => setGroupName(e.target.value)}
            value={groupName}
          />

          <div
            className="rounded-lg bg-[#2c2e3b] p-3 border border-gray-600 text-white min-h-[50px] max-h-[150px] overflow-y-auto flex flex-wrap gap-2 mt-3 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedContacts.length === 0 ? (
              <span className="text-gray-400">Contacts on Rex</span>
            ) : (
              selectedContacts.map((contact) => (
                <span
                  key={contact.value}
                  className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                    {contact.image ? (
                      <AvatarImage
                        src={contact.image}
                        alt="profile"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div
                        className={`uppercase h-8 w-8 text-xs border flex items-center justify-center rounded-full ${getColor(
                          contact.color
                        )}`}
                      >
                        {contact.label[0]}
                      </div>
                    )}
                  </Avatar>
                  <span className="text-white font-medium">
                    {contact.label}
                  </span>
                  <FaTimes
                    className="cursor-pointer text-gray-400 hover:text-purple-400 transition-all duration-200 text-xs"
                    onClick={() => toggleSelect(contact)}
                  />
                </span>
              ))
            )}
          </div>

          {/* Contacts List (Hidden Initially, Opens on Click) */}
          {isOpen && (
            <div className="mt-3 bg-[#1e1f29] p-3 rounded-lg shadow-md max-h-60 overflow-y-auto">
              <FaTimes
                className="fixed right-8"
                onClick={() => setIsOpen(!isOpen)}
              />
              {allContacts.map((contact) => (
                <div
                  key={contact.value}
                  className={`flex items-center gap-3 p-3 mt-1 cursor-pointer rounded-lg transition-all duration-200 ${
                    selectedContacts.some((c) => c.value === contact.value)
                      ? "bg-gray-700"
                      : "hover:bg-gray-700"
                  }`}
                  onClick={() => toggleSelect(contact)}
                >
                  <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                    {contact.image ? (
                      <AvatarImage
                        src={contact.image}
                        alt="profile"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div
                        className={`uppercase h-10 w-10 text-xs border flex items-center justify-center rounded-full ${getColor(
                          contact.color
                        )}`}
                      >
                        {contact.label[0]}
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <span className="text-white text-sm font-semibold">
                      {contact.label}
                    </span>
                    <p className="text-xs text-gray-400">{contact.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full bg-purple-700 hover:bg-purple-800 transition-all duration-300 mt-3" onClick={createGroup}>
            Create Group
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateGroup;
