'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface TaskFormState {
  isOpen: boolean;
  defaultStartDate: string | undefined;
  editingTask: any;
}

interface TaskFormContextType {
  state: TaskFormState;
  open: (defaultStartDate?: string) => void;
  close: () => void;
  edit: (task: any) => void;
}

const TaskFormContext = createContext<TaskFormContextType | undefined>(undefined);

export function TaskFormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TaskFormState>({
    isOpen: false,
    defaultStartDate: undefined,
    editingTask: undefined,
  });

  const open = (defaultStartDate?: string) => {
    setState({
      isOpen: true,
      defaultStartDate,
      editingTask: undefined,
    });
  };

  const close = () => {
    setState({
      isOpen: false,
      defaultStartDate: undefined,
      editingTask: undefined,
    });
  };

  const edit = (task: any) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      editingTask: task,
    }));
  };

  return (
    <TaskFormContext.Provider value={{ state, open, close, edit }}>
      {children}
    </TaskFormContext.Provider>
  );
}

export function useTaskForm() {
  const context = useContext(TaskFormContext);
  if (context === undefined) {
    throw new Error('useTaskForm must be used within TaskFormProvider');
  }
  return context;
}
