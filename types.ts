
import type { Chat } from "@google/genai";

export interface StoryPage {
  id: number;
  text: string;
  imageUrl: string | null;
  audioBuffer: AudioBuffer | null;
}

export interface LoadingState {
  text: boolean;
  image: boolean;
  audio: boolean;
}
