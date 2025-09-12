import { GoogleGenAI, Type, Content } from "@google/genai";
import type { LessonAnalysis, ScheduleItem, VideoResult, Language, ChatMessage, Quiz } from '../types';
import { prompts } from '../locales/prompts';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const blobToGenerativePart = async (blob: Blob) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type },
  };
};

export const generateChatResponse = async (
  history: Content[],
  newPrompt: { text: string; image?: File },
  studentAge: number,
  studentGrade: number,
  language: Language
): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = prompts.chat[language].systemInstruction(studentAge, studentGrade);

    const userParts = [];
    if (newPrompt.text) {
        userParts.push({ text: newPrompt.text });
    }
    if (newPrompt.image) {
        const imagePart = await fileToGenerativePart(newPrompt.image);
        userParts.push(imagePart);
    }
  
    const newUserContent: Content = { role: 'user', parts: userParts };
    const contents = [...history, newUserContent];
  
    try {
        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
            },
        });
        
        return response.text;
    } catch (e) {
        console.error("Gemini API Error (generateChatResponse):", e);
        throw new Error("error_api_communication");
    }
};

export const generateLessonAnalysis = async (
  content: string | File,
  language: Language,
  studentAge?: number,
  studentGrade?: number,
): Promise<LessonAnalysis> => {
  const model = 'gemini-2.5-flash';
  const systemInstruction = prompts.lessonAnalysis[language].systemInstruction;
  
  const prompt = prompts.lessonAnalysis[language].prompt(typeof content === 'string' ? content : prompts.lessonAnalysis[language].imageContent, studentAge, studentGrade);

  const parts = typeof content === 'string' 
    ? [{ text: prompt }] 
    : [await fileToGenerativePart(content), { text: prompt }];

  let response;
  try {
    response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mindMap: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ['title']
            },
            explanation: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['mindMap', 'explanation', 'keywords']
        }
      }
    });
  } catch (e) {
    console.error("Gemini API Error (generateLessonAnalysis):", e);
    throw new Error("error_api_communication");
  }

  try {
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as LessonAnalysis;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text, e);
    throw new Error("error_response_parsing");
  }
};


export const searchVideos = async (keywords: string[], language: Language, studentAge?: number): Promise<VideoResult[]> => {
  const model = 'gemini-2.5-flash';
  const query = prompts.videoSearch[language].prompt(keywords, studentAge);

  let response;
  try {
    response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (e) {
    console.error("Gemini API Error (searchVideos):", e);
    throw new Error("error_api_communication");
  }
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!groundingChunks) {
      return [];
  }

  const videoResults: VideoResult[] = groundingChunks
      .map((chunk: any) => ({
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'Untitled Video',
      }))
      .filter((video: VideoResult) => video.uri && video.uri.includes('youtube.com'));

  return videoResults.slice(0, 5); // Return top 5 results
};

export const generateSchedule = async (
  preferences: string,
  studentAge: number,
  language: Language
): Promise<ScheduleItem[]> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = prompts.schedule[language].systemInstruction;
    const prompt = prompts.schedule[language].prompt(studentAge, preferences);

    let response;
    try {
      response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ['time', 'activity', 'icon']
              }
            }
          }
      });
    } catch(e) {
      console.error("Gemini API Error (generateSchedule):", e);
      throw new Error("error_api_communication");
    }

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ScheduleItem[];
    } catch (e) {
        console.error("Failed to parse Gemini schedule response:", response.text, e);
        throw new Error("error_response_parsing");
    }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const prompt = "Transcribe this audio.";
    
    try {
        const audioPart = await blobToGenerativePart(audioBlob);
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [ {text: prompt}, audioPart ]},
        });
        
        const transcription = response.text;
        if (!transcription) {
            throw new Error("Empty transcription result from API.");
        }
        
        return transcription.trim();
    } catch (e) {
        console.error("Gemini API Error (transcribeAudio):", e);
        throw new Error("error_transcription_failed");
    }
};

/**
 * Converts text to speech using the browser's built-in Web Speech API.
 * This client-side approach is fast, works offline, and doesn't require
 * additional API calls, providing a seamless user experience for voice lessons.
 * @param text The text to be spoken.
 * @param lang The language code for the speech synthesis (e.g., 'ar-SA', 'en-US').
 * @param onEnd A callback function to execute when speech has finished.
 */
export const textToSpeech = (text: string, lang: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      if (onEnd) {
          utterance.onend = onEnd;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser does not support text-to-speech.");
      onEnd?.();
    }
};

export const generateQuiz = async (
  lessonContent: string,
  language: Language,
  studentAge: number,
  studentGrade: number
): Promise<Omit<Quiz, 'id' | 'createdAt'>> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = prompts.quizGeneration[language].systemInstruction;
    const prompt = prompts.quizGeneration[language].prompt(lessonContent, studentAge, studentGrade);
    
    let response;
    try {
        response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    questionText: { type: Type.STRING },
                                    answers: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                text: { type: Type.STRING },
                                                isCorrect: { type: Type.BOOLEAN }
                                            },
                                            required: ['text', 'isCorrect']
                                        }
                                    }
                                },
                                required: ['questionText', 'answers']
                            }
                        }
                    },
                    required: ['topic', 'questions']
                }
            }
        });
    } catch (e) {
        console.error("Gemini API Error (generateQuiz):", e);
        throw new Error("error_api_communication");
    }
    
    try {
        const jsonText = response.text.trim();
        const parsedQuiz = JSON.parse(jsonText);

        // Basic validation of the parsed structure
        if (!parsedQuiz.topic || !Array.isArray(parsedQuiz.questions) || parsedQuiz.questions.length === 0) {
            throw new Error("Invalid quiz structure received from API.");
        }
        
        return parsedQuiz as Omit<Quiz, 'id' | 'createdAt'>;
    } catch (e) {
        console.error("Failed to parse Gemini quiz response:", response.text, e);
        throw new Error("error_response_parsing");
    }
};