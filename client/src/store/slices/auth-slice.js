export const createAuthSlice = (set, get)=>({
    userInfo:undefined,
    setUserInfo:(newUserInfo)=>set((state)=>({
        userInfo: newUserInfo ? {
            ...state.userInfo,
            ...newUserInfo
        } : undefined
    }))
})
