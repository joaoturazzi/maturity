import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  activeModal: string | null;
  alerts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addAlert: (alert: { message: string; type: 'success' | 'error' | 'warning' | 'info' }) => void;
  removeAlert: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  alerts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id: crypto.randomUUID() }],
    })),
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}));
