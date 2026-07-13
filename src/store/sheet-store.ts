import { create } from 'zustand';
import type { TransactionType } from '@/types';

interface SheetState {
  isOpen: boolean;
  type: TransactionType;
  openSheet: (type?: TransactionType) => void;
  closeSheet: () => void;
}

export const useSheetStore = create<SheetState>((set) => ({
  isOpen: false,
  type: 'expense',
  openSheet: (type = 'expense') => set({ isOpen: true, type }),
  closeSheet: () => set({ isOpen: false }),
}));
