import React, { useState, useEffect, useRef, FC } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { VoiceNote } from '../types';
import { MicrophoneIcon, StopIcon, PlayIcon, PauseIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from './icons/Icons';
import { transcribeAudio } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface VoiceNotesProps {
  lessonTopic: string;
  studentId: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

const formatTime = (seconds: number) => {
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const AudioPlayer: FC<{ note: VoiceNote, onDelete?: (id: string) => void, onEdit?: (note: VoiceNote) => void }> = ({ note, onDelete, onEdit }) => {
    const { t } = useTranslation();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };
        
        const handleLoadedMetadata = () => {
            if(audio) setCurrentTime(audio.currentTime);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);


        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    return (
        <div className="flex items-center space-x-3 rtl:space-x-reverse w-full p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <audio ref={audioRef} src={note.dataUrl} preload="metadata" />
            <button onClick={togglePlay} className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition">
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex-grow bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-mono w-28 text-center">
                {formatTime(currentTime)} / {formatTime(note.duration)}
            </span>
            {onEdit && (
                 <button onClick={() => onEdit(note)} className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition" aria-label={t('edit_note')}>
                    <PencilIcon className="w-5 h-5" />
                </button>
            )}
            {onDelete && (
                <button onClick={() => onDelete(note.id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition" aria-label={t('delete_note')}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

const VoiceNotes: React.FC<VoiceNotesProps> = ({ lessonTopic, studentId }) => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [newNoteTranscription, setNewNoteTranscription] = useState('');
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTranscription, setEditingTranscription] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  const storageKey = `voiceNotes_${studentId}_${lessonTopic}`;

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(storageKey);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
          setNotes([]);
      }
    } catch (e) {
      console.error("Failed to load voice notes:", e);
      setNotes([]);
    }
  }, [storageKey]);

  const saveNotes = (updatedNotes: VoiceNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
  };

  const startRecording = async () => {
    setPermissionError(null);
    setError(null);
    setAudioBlob(null);
    setNewNoteTranscription('');
    
    if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionError(t('error_mic_unsupported'));
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            setAudioBlob(blob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = window.setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        setPermissionError(t('mic_permission_denied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleTranscribe = async () => {
      if (!audioBlob) return;
      if (!isOnline) {
          setError(t('offline_feature_disabled'));
          return;
      }
      setIsTranscribing(true);
      setError(null);
      try {
          const transcription = await transcribeAudio(audioBlob);
          setNewNoteTranscription(transcription);
      } catch (err) {
          const messageKey = err instanceof Error ? err.message : 'error_unexpected';
          setError(t(messageKey));
      } finally {
          setIsTranscribing(false);
      }
  };

  const handleSaveNote = async () => {
    if (!audioBlob) return;
    try {
        setError(null);
        const dataUrl = await blobToBase64(audioBlob);
        const newNote: VoiceNote = {
            id: Date.now().toString(),
            dataUrl,
            createdAt: new Date().toISOString(),
            duration: recordingDuration,
            transcription: newNoteTranscription,
        };
        saveNotes([...notes, newNote]);
        setAudioBlob(null);
        setRecordingDuration(0);
        setNewNoteTranscription('');
    } catch (err) {
        console.error("Failed to save note:", err);
        setError(t('error_note_save'));
    }
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
  };
  
  const handleStartEditing = (note: VoiceNote) => {
      setEditingNoteId(note.id);
      setEditingTranscription(note.transcription || '');
  };

  const handleCancelEditing = () => {
      setEditingNoteId(null);
      setEditingTranscription('');
  };
  
  const handleSaveChanges = () => {
      if (editingNoteId === null) return;
      const updatedNotes = notes.map(note => 
          note.id === editingNoteId 
              ? { ...note, transcription: editingTranscription } 
              : note
      );
      saveNotes(updatedNotes);
      handleCancelEditing();
  };


  const handleDiscard = () => {
      setAudioBlob(null);
      setRecordingDuration(0);
      setNewNoteTranscription('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center"><MicrophoneIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> {t('voice_notes_title')}</h3>
      
      {permissionError && <p className="text-red-500 text-sm">{permissionError}</p>}
      
      {!isRecording && !audioBlob && (
        <button
            onClick={startRecording}
            className="w-full flex justify-center items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
        >
            <MicrophoneIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('record_note_button')}
        </button>
      )}

      {isRecording && (
        <div className="w-full flex justify-center items-center px-4 py-2 bg-red-100 dark:bg-red-900/50 rounded-md">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                 <div className="relative w-6 h-6">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                    <div className="relative bg-red-500 rounded-full w-6 h-6"></div>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-300 font-mono">{formatTime(recordingDuration)}</span>
                <button
                    onClick={stopRecording}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                    <StopIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('stop_recording_button')}
                </button>
            </div>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="p-4 bg-gray-100 dark:bg-slate-900 rounded-lg space-y-4 border border-gray-200 dark:border-slate-700">
             <AudioPlayer 
                note={{ id: 'preview', dataUrl: URL.createObjectURL(audioBlob), duration: recordingDuration, createdAt: '' }} 
            />
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('transcription_title')}</label>
                <textarea 
                    value={newNoteTranscription}
                    onChange={(e) => setNewNoteTranscription(e.target.value)}
                    placeholder={t('transcription_placeholder')}
                    className={`w-full h-24 p-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 transition ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    readOnly={isTranscribing}
                />
             </div>
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <button 
                    onClick={handleTranscribe} 
                    disabled={isTranscribing || !isOnline}
                    title={!isOnline ? t('offline_feature_disabled') : ''}
                    className="flex justify-center items-center px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-indigo-300/50 disabled:cursor-not-allowed transition text-sm"
                >
                   {isTranscribing ? <><LoadingSpinner /> {t('transcribing')}</> : t('transcribe_button')}
                </button>
                <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                    <button onClick={handleDiscard} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 transition text-sm">{t('discard_note')}</button>
                    <button onClick={handleSaveNote} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm">{t('save_note')}</button>
                </div>
            </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.length > 0 ? (
            [...notes].reverse().map(note => (
                <div key={note.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <AudioPlayer note={note} onDelete={handleDeleteNote} onEdit={handleStartEditing} />
                    {editingNoteId === note.id ? (
                        <div className="mt-4 space-y-3">
                            <textarea
                                value={editingTranscription}
                                onChange={(e) => setEditingTranscription(e.target.value)}
                                className="w-full h-28 p-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                                placeholder={t('transcription_placeholder')}
                            />
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                <button onClick={handleCancelEditing} className="p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700 rounded-full transition">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                                <button onClick={handleSaveChanges} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-full transition">
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        note.transcription && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">{t('transcription_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-slate-900/50 p-3 rounded-md">{note.transcription}</p>
                            </div>
                        )
                    )}
                </div>
            ))
        ) : (
            !audioBlob && !isRecording && <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400">{t('no_books_description')}</p>
        )}
      </div>

    </div>
  );
};

export default VoiceNotes;