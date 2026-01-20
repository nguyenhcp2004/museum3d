import { create } from 'zustand'

export const useStore = create((set) => ({
    currentRoom: 0,
    isLocked: false,
    interactionData: null, // { title: string, content: string } | null

    setRoom: (index) => set({ currentRoom: index }),
    setIsLocked: (locked) => set({ isLocked: locked }),
    setInteractionData: (data) => set({ interactionData: data }),
}))
