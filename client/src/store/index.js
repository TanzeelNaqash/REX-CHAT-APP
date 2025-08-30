// store/index.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice } from './slices/auth-slice';
import { createChatSlice } from './slices/chat-slice';



export const useAppStore = create(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createChatSlice(...a),
     
    }),
  )
);
