export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    directMessagesContacts: [],
    isUploading: false,
    isDownloading: false,
    fileUploadProgress: 0,
    fileDownloadProgress: 0,
    groups:[],
    setGroups: (groups)=> set({groups}),
    setIsUploading: (isUploading) => set({ isUploading }),
    setIsDownloading: (isDownloading) => set({ isDownloading }),
    setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
    setFileDownloadProgress: (fileDownloadProgress) => set({ fileDownloadProgress }),
    setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
    setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
    setSelectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
    setdirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),
    addGroup: (group)=>{
      const groups = get().groups
      set({groups:[group,...groups]})
    },
    closeChat: () =>
      set({
        selectedChatData: undefined,
        selectedChatType: undefined,
        selectedChatMessages: [],
      }),
  
    addMessage: (message) => {
      const selectedChatMessages = get().selectedChatMessages;
      const selectedChatType = get().selectedChatType;
  
      set({
        selectedChatMessages: [
          ...selectedChatMessages,
          {
            ...message,
            recipient:
              selectedChatType === "group"
                ? message.recipient
                : message.recipient._id,
            sender:
              selectedChatType === "group"
                ? message.sender
                : message.sender._id,
          },
        ],
      });
    },
  
    addGroupInGroupList: (message)=>{
      const groups = get().groups;
      const data = groups.find((group)=> group._id === message.groupId);
      const index = groups.findIndex((group)=> group._id === message.groupId);
      console.log(groups, data, index);
      if(index !== -1 && index !== undefined){
        groups.splice(index, 1);
        groups.unshift(data)
      }
      
    },

    addContactsInDMContacts:(message)=>{
      const userId = get().userInfo.id;
      const fromId = 
      message.sender._id === userId 
      ? message.recipient._id
      : message.sender._id;
      const fromData =
      message.sender._id === userId ? message.recipient : message.sender;
      const dmContacts = get().directMessagesContacts;
      const data = dmContacts.findIndex((contact)=> contact._id=== fromId);
      const index = dmContacts.findIndex((contact)=> contact._id=== fromId);
      console.log({data, index, dmContacts, userId, message, fromData});
      if(index !== -1 && index !== undefined){
        console.log("in if condition");
        dmContacts.splice(index,1);
        dmContacts.unshift(fromData);
      } else{
        console.log("in else condition");
        dmContacts.unshift(fromData)
      }
      set({directMessagesContacts:dmContacts})
    },

  });
  