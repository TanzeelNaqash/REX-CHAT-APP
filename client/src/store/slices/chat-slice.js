export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    directMessagesContacts: [],
    isUploading: false,
    isDownloading: false,
    shouldRefreshContacts: false,
    fileUploadProgress: 0,
    fileDownloadProgress: 0,
    groups:[],
    onlineUsers: [],
    unreadCounts: {},
    recentMessages: {},
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    setGroups: (groups)=> set({groups}),
    setIsUploading: (isUploading) => set({ isUploading }),
    setIsDownloading: (isDownloading) => set({ isDownloading }),
    setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
    setFileDownloadProgress: (fileDownloadProgress) => set({ fileDownloadProgress }),
    setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
    setSelectedChatData: (selectedChatData) => {
        const unreadCounts = get().unreadCounts;
        if (selectedChatData) {
            unreadCounts[selectedChatData._id] = 0;
        }
        set({ 
            selectedChatData,
            unreadCounts: { ...unreadCounts }
        });
    },
    setSelectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
    setdirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),
    setShouldRefreshContacts: (value) => set({ shouldRefreshContacts: value }),
    incrementUnreadCount: (chatId) => {
        const { selectedChatData, unreadCounts } = get();
        console.log("Incrementing unread count in store:", {
            chatId,
            selectedChat: selectedChatData?._id,
            currentCounts: unreadCounts
        });

        if (selectedChatData?._id === chatId) {
            console.log("Not incrementing - user is in this chat");
            return;
        }

        set({
            unreadCounts: {
                ...unreadCounts,
                [chatId]: (unreadCounts[chatId] || 0) + 1
            }
        });
        console.log("Updated unread counts:", get().unreadCounts);
    },
    updateRecentMessage: (chatId, message) => {
        const { recentMessages } = get();
        const existingMessage = recentMessages[chatId];
        
        if (!existingMessage || new Date(message.timestamp) > new Date(existingMessage.timestamp)) {
      set({
                recentMessages: {
                    ...recentMessages,
                    [chatId]: {
                        ...message,
                        timestamp: message.timestamp || new Date().toISOString()
                    }
                }
            });
        }
    },
    addMessage: (message) => {
      const selectedChatMessages = get().selectedChatMessages;
      const selectedChatType = get().selectedChatType;
        const selectedChatData = get().selectedChatData;
        const userId = get().userInfo.id;

        let chatId;
        if (selectedChatType === "group") {
            chatId = message.groupId;
        } else {
            chatId = message.sender._id === userId ? message.recipient._id : message.sender._id;
        }

        if (message.sender._id !== userId && chatId !== selectedChatData?._id) {
            get().incrementUnreadCount(chatId);
        }

        const recentMessage = {
            content: message.content,
            timestamp: message.timestamp || new Date().toISOString(),
            sender: message.sender,
            messageType: message.messageType,
            fileUrl: message.fileUrl
        };

        get().updateRecentMessage(chatId, recentMessage);

        if (chatId === selectedChatData?._id) {
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
        }

        if (selectedChatType !== "group") {
            get().addContactsInDMContacts(message);
        } else {
            get().addGroupInGroupList(message);
        }
    },
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
  
    addGroupInGroupList: (message) => {
      const groups = get().groups;
        const data = groups.find((group) => group._id === message.groupId);
        const index = groups.findIndex((group) => group._id === message.groupId);
        if (index !== -1 && index !== undefined) {
        groups.splice(index, 1);
            groups.unshift(data);
      }
    },

    addContactsInDMContacts: (message) => {
      const userId = get().userInfo.id;
        const fromId = message.sender._id === userId ? message.recipient._id : message.sender._id;
        const fromData = message.sender._id === userId ? message.recipient : message.sender;
      const dmContacts = get().directMessagesContacts;
        const index = dmContacts.findIndex((contact) => contact._id === fromId);
        
        if (index !== -1 && index !== undefined) {
            dmContacts.splice(index, 1);
            dmContacts.unshift(fromData);
        } else {
        dmContacts.unshift(fromData);
      }
        set({ directMessagesContacts: dmContacts });
    },

  });
  