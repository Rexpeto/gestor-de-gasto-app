import { create } from 'zustand';
import type { Transaction, TransactionType } from '@/types';

interface SheetState {
  isOpen: boolean;
  type: TransactionType;
  /** When set, the sheet is in edit mode for this transaction */
  editingTransaction: Transaction | null;
  openSheet: (type?: TransactionType, transaction?: Transaction) => void;
  closeSheet: () => void;
}

export const useSheetStore = create<SheetState>((set) => ({
  isOpen: false,
  type: 'expense',
  editingTransaction: null,
  openSheet: (type = 'expense', transaction = null) =>
    set({ isOpen: true, type, editingTransaction: transaction }),
  closeSheet: () => set({ isOpen: false, editingTransaction: null }),
}));
