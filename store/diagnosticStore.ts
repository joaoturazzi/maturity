import { create } from 'zustand';
import type { DiagnosticResponseInput } from '@/types/diagnostic';

interface DiagnosticStore {
  cycleId: string | null;
  currentDimensionIndex: number;
  currentIndicatorIndex: number;
  responses: Record<string, DiagnosticResponseInput>;
  isSubmitting: boolean;

  setCycleId: (id: string) => void;
  setCurrentDimension: (index: number) => void;
  setCurrentIndicator: (index: number) => void;
  setResponse: (indicatorId: string, response: DiagnosticResponseInput) => void;
  setSubmitting: (value: boolean) => void;
  reset: () => void;
}

export const useDiagnosticStore = create<DiagnosticStore>((set) => ({
  cycleId: null,
  currentDimensionIndex: 0,
  currentIndicatorIndex: 0,
  responses: {},
  isSubmitting: false,

  setCycleId: (id) => set({ cycleId: id }),
  setCurrentDimension: (index) => set({ currentDimensionIndex: index, currentIndicatorIndex: 0 }),
  setCurrentIndicator: (index) => set({ currentIndicatorIndex: index }),
  setResponse: (indicatorId, response) =>
    set((state) => ({
      responses: { ...state.responses, [indicatorId]: response },
    })),
  setSubmitting: (value) => set({ isSubmitting: value }),
  reset: () =>
    set({
      cycleId: null,
      currentDimensionIndex: 0,
      currentIndicatorIndex: 0,
      responses: {},
      isSubmitting: false,
    }),
}));
