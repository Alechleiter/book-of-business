import { create } from 'zustand';
import type { PropertyFilters } from '@/types/database';

interface FilterState {
  filters: PropertyFilters;
  setFilter: (key: keyof PropertyFilters, value: unknown) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value || undefined },
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  clearFilters: () => set({ filters: {} }),
  activeFilterCount: () => {
    const f = get().filters;
    return Object.values(f).filter((v) => v !== undefined && v !== '' && v !== null).length;
  },
}));
