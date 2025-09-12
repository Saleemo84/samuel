import { Part } from "@google/genai";

export interface Student {
  id: string;
  name: string;
  age: number;
  grade: number;
}

export type Tab = 'chat' | 'lesson' | 'schedule' | 'books' | 'voice_lessons' | 'games' | 'quiz';

export type Language = 'ar' | 'en' | 'ku';

export interface MindMapNode {
  title: string;
  children?: MindMapNode[];
}

export interface LessonAnalysis {
  mindMap: MindMapNode;
  explanation: string;
  keywords: string[];
}

export interface VideoResult {
  uri: string;
  title: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
  icon: string;
}

export interface Book {
  id: string;
  name: string;
  dataUrl: string;
  type: string;
  grade: number;
  subject: string;
}

export interface VoiceNote {
  id: string;
  dataUrl: string; // base64 data URL
  createdAt: string; // ISO string
  duration: number; // in seconds
  transcription?: string;
}

export interface VoiceLesson {
  id: string;
  text: string;
  createdAt: string;
}

export interface ChatContentPart extends Part {
    // We can extend the Part type if we need additional client-side properties
    // For now, it directly maps to the Gemini API Part type
    // Example: { text: "hello" } or { inlineData: { mimeType: "image/png", data: "..." } }
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatContentPart[];
}

// Types for the Quiz feature
export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  questionText: string;
  answers: Answer[];
}

export interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
  createdAt: string;
}