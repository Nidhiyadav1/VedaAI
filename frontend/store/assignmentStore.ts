import { create } from 'zustand';

export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

interface StoreState {
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  file: File | null;
  setDueDate: (d: string) => void;
  setFile: (f: File | null) => void;
  setAdditionalInstructions: (s: string) => void;
  addQuestionType: () => void;
  removeQuestionType: (i: number) => void;
  updateQuestionType: (i: number, field: keyof QuestionType, value: string | number) => void;
  reset: () => void;
  getTotalQuestions: () => number;
  getTotalMarks: () => number;
}

export const useAssignmentStore = create<StoreState>((set, get) => ({
  dueDate: '',
  questionTypes: [
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
  ],
  additionalInstructions: '',
  file: null,

  setDueDate: (d) => set({ dueDate: d }),
  setFile: (f) => set({ file: f }),
  setAdditionalInstructions: (s) => set({ additionalInstructions: s }),

  addQuestionType: () => set((s) => ({
    questionTypes: [...s.questionTypes, { type: 'Long Questions', count: 2, marks: 5 }]
  })),

  removeQuestionType: (i) => set((s) => ({
    questionTypes: s.questionTypes.filter((_, idx) => idx !== i)
  })),

  updateQuestionType: (i, field, value) => set((s) => ({
    questionTypes: s.questionTypes.map((qt, idx) =>
      idx === i ? { ...qt, [field]: field === 'type' ? value : Number(value) } : qt
    )
  })),

  reset: () => set({
    dueDate: '',
    questionTypes: [
      { type: 'Multiple Choice Questions', count: 4, marks: 1 },
      { type: 'Short Questions', count: 3, marks: 2 },
    ],
    file: null,
    additionalInstructions: ''
  }),

  getTotalQuestions: () => get().questionTypes.reduce((s, qt) => s + qt.count, 0),
  getTotalMarks: () => get().questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0),
}));