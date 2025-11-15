
import React, { useState, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { startChat, generateStoryText, generateImage, generateSpeech } from './services/geminiService';
import type { StoryPage, LoadingState } from './types';

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C11.45 2 11 2.45 11 3V4.59L9.71 5.88C9.32 6.27 9.32 6.91 9.71 7.29L10.41 8L8 10.41L7.29 9.71C6.91 9.32 6.27 9.32 5.88 9.71L4.59 11H3C2.45 11 2 11.45 2 12C2 12.55 2.45 13 3 13H4.59L5.88 14.29C6.27 14.68 6.91 14.68 7.29 14.29L8 13.59L10.41 16L9.71 16.71C9.32 17.09 9.32 17.73 9.71 18.12L11 19.41V21C11 21.55 11.45 22 12 22C12.55 22 13 21.55 13 21V19.41L14.29 18.12C14.68 17.73 14.68 17.09 14.29 16.71L13.59 16L16 13.59L16.71 14.29C17.09 14.68 17.73 14.68 18.12 14.29L19.41 13H21C21.55 13 22 12.55 22 12C22 11.45 21.55 11 21 11H19.41L18.12 9.71C17.73 9.32 17.09 9.32 16.71 9.71L16 10.41L13.59 8L14.29 7.29C14.68 6.91 14.68 6.27 14.29 5.88L13 4.59V3C13 2.45 12.55 2 12 2Z" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div>
);

const InitialPromptForm: React.FC<{ onStart: (prompt: string) => void, isLoading: boolean }> = ({ onStart, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onStart(prompt.trim());
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-full p-4 text-center">
            <SparkleIcon className="w-24 h-24 text-amber-400 mb-6 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-bold text-sky-800 mb-4">AI Story Weaver</h1>
            <p className="text-lg text-sky-700 mb-8">What kind of story would you like to read today?</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., a brave little rocket exploring the stars"
                    className="flex-grow p-4 text-lg border-2 border-sky-300 rounded-full focus:ring-4 focus:ring-amber-300 focus:border-sky-500 transition duration-300"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="bg-sky-500 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-sky-600 transition-transform transform hover:scale-105 disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isLoading ? <LoadingSpinner /> : "Weave a Story"}
                </button>
            </form>
        </div>
    );
};


const StoryViewer: React.FC<{ pages: StoryPage[], currentPageIndex: number, loadingState: LoadingState, onNavigate: (direction: 'prev' | 'next') => void, onPlayAudio: (pageIndex: number) => void }> = ({ pages, currentPageIndex, loadingState, onNavigate, onPlayAudio }) => {
    const currentPage = pages[currentPageIndex];

    const isGenerating = loadingState.text || loadingState.image || loadingState.audio;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-grow bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                 <div className="w-full aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                    {loadingState.image && !currentPage?.imageUrl ? (
                        <div className="flex flex-col items-center gap-4 text-sky-600">
                             <LoadingSpinner />
                             <p>Drawing a picture...</p>
                        </div>
                    ) : (
                        currentPage?.imageUrl ? <img src={currentPage.imageUrl} alt="Story illustration" className="w-full h-full object-cover" /> : <div className="text-gray-400">Your illustration will appear here!</div>
                    )}
                </div>
                <div className="p-6 md:p-8 flex-grow overflow-y-auto">
                     {loadingState.text && !currentPage?.text ? (
                        <div className="flex flex-col items-center gap-4 text-sky-600">
                            <LoadingSpinner />
                            <p>Writing the next part of the story...</p>
                        </div>
                    ) : (
                        <p className="text-xl md:text-2xl text-slate-800 leading-relaxed font-serif">{currentPage?.text}</p>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 mt-6 flex items-center justify-center gap-4">
                <button onClick={() => onNavigate('prev')} disabled={currentPageIndex === 0 || isGenerating} className="px-6 py-3 rounded-full bg-white shadow-lg text-sky-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105">&lt; Back</button>
                
                <button onClick={() => onPlayAudio(currentPageIndex)} disabled={!currentPage?.audioBuffer || isGenerating} className="p-4 rounded-full bg-emerald-500 text-white shadow-xl disabled:bg-emerald-300 disabled:cursor-not-allowed transition-transform transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>

                <button onClick={() => onNavigate('next')} disabled={isGenerating} className="px-6 py-3 rounded-full bg-white shadow-lg text-sky-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105">Next &gt;</button>
            </div>
             <p className="text-center mt-2 text-sky-700/80">Page {currentPageIndex + 1}</p>
        </div>
    )
};


export default function App() {
    const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isStoryStarted, setIsStoryStarted] = useState(false);
    const [loadingState, setLoadingState] = useState<LoadingState>({ text: false, image: false, audio: false });
    
    const chatSession = useRef<Chat | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const currentlyPlayingSource = useRef<AudioBufferSourceNode | null>(null);

    const handleStartStory = useCallback(async (prompt: string) => {
        setLoadingState({ text: true, image: true, audio: true });
        setIsStoryStarted(true);

        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const systemInstruction = "You are a storyteller for young children aged 3-6. Your stories are simple, positive, and have a touch of magic. Never say things like 'Page 1' or 'The End'. Just write the story content. Each response should be a single, short page of the story (one or two paragraphs).";
        chatSession.current = startChat(systemInstruction);

        const firstPagePrompt = `Start a story about ${prompt}.`;
        
        try {
            const text = await generateStoryText(chatSession.current, firstPagePrompt);
            const newPage: StoryPage = { id: 0, text, imageUrl: null, audioBuffer: null };
            setStoryPages([newPage]);
            setLoadingState(prev => ({ ...prev, text: false }));

            const [imageUrl, audioBuffer] = await Promise.all([
                generateImage(text),
                generateSpeech(text, audioContext.current)
            ]);
            
            setStoryPages(pages => pages.map(p => p.id === 0 ? { ...p, imageUrl, audioBuffer } : p));
            setLoadingState({ text: false, image: false, audio: false });
            
            if(audioBuffer) {
                handlePlayAudio(0, audioBuffer);
            }

        } catch (error) {
            console.error("Failed to start story:", error);
            setLoadingState({ text: false, image: false, audio: false });
            setIsStoryStarted(false); // Go back to prompt screen on error
        }
    }, []);

    const generateNewPage = useCallback(async (pageIndex: number) => {
        if (!chatSession.current || !audioContext.current) return;
        
        setLoadingState({ text: true, image: true, audio: true });
        
        const continuationPrompt = "Continue the story. Write the next page.";

        try {
            const text = await generateStoryText(chatSession.current, continuationPrompt);
            const newPage: StoryPage = { id: pageIndex, text, imageUrl: null, audioBuffer: null };
            setStoryPages(pages => [...pages, newPage]);
            setLoadingState(prev => ({ ...prev, text: false }));

            const [imageUrl, audioBuffer] = await Promise.all([
                generateImage(text),
                generateSpeech(text, audioContext.current)
            ]);

            setStoryPages(pages => pages.map(p => p.id === pageIndex ? { ...p, imageUrl, audioBuffer } : p));
            setLoadingState({ text: false, image: false, audio: false });
             if(audioBuffer) {
                handlePlayAudio(pageIndex, audioBuffer);
            }
        } catch (error) {
            console.error("Failed to generate new page:", error);
            setLoadingState({ text: false, image: false, audio: false });
        }
    }, []);

    const handleNavigation = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentPageIndex > 0) {
                setCurrentPageIndex(currentPageIndex - 1);
            }
        } else {
            const nextPageIndex = currentPageIndex + 1;
            if (nextPageIndex < storyPages.length) {
                setCurrentPageIndex(nextPageIndex);
            } else {
                setCurrentPageIndex(nextPageIndex);
                generateNewPage(nextPageIndex);
            }
        }
    };

    const handlePlayAudio = (pageIndex: number, buffer?: AudioBuffer | null) => {
        if (currentlyPlayingSource.current) {
            currentlyPlayingSource.current.stop();
        }
        
        const audioBuffer = buffer || storyPages[pageIndex]?.audioBuffer;
        if (audioBuffer && audioContext.current) {
            const source = audioContext.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.current.destination);
            source.start(0);
            currentlyPlayingSource.current = source;
        }
    };
    
    const isLoading = loadingState.text || loadingState.image || loadingState.audio;

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-amber-100 to-sky-200 flex items-center justify-center p-4 md:p-8 font-sans">
            {!isStoryStarted ? (
                <InitialPromptForm onStart={handleStartStory} isLoading={isLoading} />
            ) : (
                <div className="w-full max-w-4xl h-[90vh] max-h-[800px]">
                    <StoryViewer
                        pages={storyPages}
                        currentPageIndex={currentPageIndex}
                        loadingState={loadingState}
                        onNavigate={handleNavigation}
                        onPlayAudio={handlePlayAudio}
                    />
                </div>
            )}
        </main>
    );
}
