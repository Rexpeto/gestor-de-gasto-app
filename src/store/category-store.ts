import { create } from 'zustand';

import * as db from '@/db/database';
import type { Category, TransactionType } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  loadCategories: () => Promise<void>;
  addCategory: (data: { name: string; icon: string; color: string; type: TransactionType }) => Promise<void>;
  editCategory: (id: number, data: { name: string; icon: string; color: string }) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;
  getCategoriesByType: (type: TransactionType) => Category[];
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await db.getAllCategories();
      if (categories.length === 0) {
        console.warn('⚠️ loadCategories: array vacío — la DB devolvió 0 categorías');
      } else {
        console.log(`✅ loadCategories: ${categories.length} categorías cargadas`);
      }
      set({ categories });
    } catch (e) {
      console.error('❌ loadCategories error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: async (data) => {
    await db.createCategory(data);
    await get().loadCategories();
  },

  editCategory: async (id, data) => {
    await db.updateCategory(id, data);
    await get().loadCategories();
  },

  removeCategory: async (id) => {
    await db.deleteCategory(id);
    await get().loadCategories();
  },

  getCategoriesByType: (type) => {
    return get().categories.filter((c) => c.type === type);
  },
}));
