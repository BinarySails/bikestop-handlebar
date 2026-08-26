import { create } from "zustand";

interface CartDrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartDrawerStore = create<CartDrawerState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
