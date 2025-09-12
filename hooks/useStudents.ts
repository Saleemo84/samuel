
import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';

const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudentState] = useState<Student | null>(null);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('students');
      const storedActiveStudentId = localStorage.getItem('activeStudentId');
      
      if (storedStudents) {
        const parsedStudents: Student[] = JSON.parse(storedStudents);
        setStudents(parsedStudents);

        if (storedActiveStudentId) {
          const foundActive = parsedStudents.find(s => s.id === storedActiveStudentId) || null;
          setActiveStudentState(foundActive || parsedStudents[0] || null);
        } else if (parsedStudents.length > 0) {
          setActiveStudentState(parsedStudents[0]);
        }
      }
    } catch (error) {
      console.error("Failed to parse students from localStorage", error);
    }
  }, []);

  const addStudent = useCallback((studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = { ...studentData, id: Date.now().toString() };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    if (!activeStudent) {
      setActiveStudentState(newStudent);
      localStorage.setItem('activeStudentId', newStudent.id);
    }
  }, [students, activeStudent]);

  const setActiveStudent = useCallback((student: Student | null) => {
    setActiveStudentState(student);
    if (student) {
      localStorage.setItem('activeStudentId', student.id);
    } else {
      localStorage.removeItem('activeStudentId');
    }
  }, []);

  return { students, activeStudent, setActiveStudent, addStudent };
};

export default useStudents;
