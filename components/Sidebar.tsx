import React, { useState } from 'react';
import type { Playlist } from '../types';
import { HomeIcon, SearchIcon, LibraryIcon, PlusIcon, GeminiIcon, TrashIcon } from './Icons';
import { generatePlaylist } from '../services/geminiService';
import { UploadSongModal } from './UploadSongModal';
import { LIKED_SONGS_PLAYLIST_ID } from '../constants';

interface SidebarProps {
  playlists: Playlist[];
  activePlaylistId: string;
  onSelectPlaylist: (playlist: Playlist) => void;
  onAddPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onAddSongToActivePlaylist: (songDetails: { title: string; artist: string; album: string; audioFile: File; }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
}

const PlaylistGenerator: React.FC<{ onAddPlaylist: (playlist: Playlist) => void }> = ({ onAddPlaylist }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newPlaylist = await generatePlaylist(prompt);
      onAddPlaylist(newPlaylist);
      setPrompt('');
    } catch (err) {
      setError('Failed to generate playlist. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-spotify-lightgray rounded-lg mt-4 space-y-3">
        <div className="flex items-center gap-2">
            <GeminiIcon className="w-6 h-6 text-purple-400" />
            <h3 className="font-bold text-white">Generate Playlist</h3>
        </div>
      <p className="text-sm">Describe a mood, genre, or activity.</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., 80s synthwave for a midnight drive"
        className="w-full h-20 p-2 bg-spotify-darkgray rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-spotify-green"
        disabled={isLoading}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-spotify-green text-white font-bold py-2 px-4 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : 'Generate'}
      </button>
    </div>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ playlists, activePlaylistId, onSelectPlaylist, onAddPlaylist, onDeletePlaylist, onAddSongToActivePlaylist, searchQuery, onSearchChange, isSearching }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  return (
    <>
      <div className="w-full md:w-1/4 flex-shrink-0 flex flex-col gap-2">
        <div className="bg-spotify-darkgray rounded-lg p-4 space-y-4">
          <button onClick={() => playlists.length > 0 && onSelectPlaylist(playlists[0])} className="flex items-center gap-4 text-white font-bold w-full text-left transition-colors hover:text-white">
            <HomeIcon /> Home
          </button>
          <div className="flex items-center gap-4 text-spotify-gray focus-within:text-white transition-colors">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent w-full focus:outline-none text-sm placeholder-spotify-gray text-white"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-spotify-darkgray rounded-lg flex-grow flex flex-col overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <button className="flex items-center gap-4 hover:text-white transition-colors">
              <LibraryIcon /> Your Library
            </button>
            <button className="hover:text-white transition-colors" onClick={() => setIsUploadModalOpen(true)}>
              <PlusIcon />
            </button>
          </div>
          <div className="px-2 flex-grow overflow-y-auto">
            {playlists.map(playlist => {
              const isActive = !isSearching && activePlaylistId === playlist.id;
              return (
                <div key={playlist.id} className="relative rounded-md">
                    <button
                        onClick={() => onSelectPlaylist(playlist)}
                        className={`w-full text-left p-2 flex items-center gap-3 rounded-md ${isActive ? 'bg-spotify-lightgray text-white' : 'hover:bg-spotify-lightgray'}`}
                    >
                        <img src={playlist.coverArt} alt={playlist.name} className="w-12 h-12 rounded-md" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-sm truncate">{playlist.name}</p>
                          <p className="text-xs text-spotify-gray">Playlist</p>
                        </div>
                    </button>
                    {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                                    onDeletePlaylist(playlist.id);
                                }
                            }}
                            aria-label={`Delete ${playlist.name}`}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-spotify-gray hover:text-white bg-transparent hover:bg-black/30 transition-opacity z-10"
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    )}
                </div>
            )})}
          </div>
          <PlaylistGenerator onAddPlaylist={onAddPlaylist} />
        </div>
      </div>
      {isUploadModalOpen && <UploadSongModal onClose={() => setIsUploadModalOpen(false)} onUpload={onAddSongToActivePlaylist} />}
    </>
  );
};