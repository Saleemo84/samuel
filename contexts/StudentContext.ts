
import { createContext } from 'react';
import type { Student } from '../types';

interface StudentContextType {
  students: Student[];
  activeStudent: Student | null;
  setActiveStudent: (student: Student | null) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  openStudentModal: () => void;
}

export const StudentContext = createContext<StudentContextType | undefined>(undefined);
