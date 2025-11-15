
import { GoogleGenAI, Type } from "@google/genai";
import type { Playlist, Song } from "../types";

const playlistSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'The name of the generated playlist. Should be creative and reflect the user prompt.',
    },
  },
  required: ['name'],
};

export async function generatePlaylist(prompt: string): Promise<Playlist> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fullPrompt = `Generate a creative playlist name based on the following description: "${prompt}".`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: playlistSchema,
    },
  });

  const rawJson = response.text.trim();
  const generatedData = JSON.parse(rawJson) as { name: string };

  const newPlaylist: Playlist = {
    id: `gemini-${Date.now()}`,
    name: generatedData.name,
    coverArt: `https://picsum.photos/seed/${encodeURIComponent(generatedData.name)}/300/300`,
    songs: [],
  };

  return newPlaylist;
}