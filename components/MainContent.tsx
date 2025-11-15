import React, { useState, useEffect } from 'react';
import type { Playlist, Song } from '../types';
import { ClockIcon, PlayIcon, TrashIcon, HeartIcon, SolidHeartIcon } from './Icons';

interface MainContentProps {
  playlist: Playlist;
  onSelectSong: (songIndex: number) => void;
  currentSong: Song | null;
  onRemoveSong: (songId: string) => void;
  onUpdatePlaylistName: (newName: string) => void;
  isSearching: boolean;
  searchQuery: string;
  searchResults: Song[];
  onSelectSongFromSearch: (song: Song) => void;
  likedSongIds: Set<string>;
  onToggleLikeSong: (song: Song) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ playlist, onSelectSong, currentSong, onRemoveSong, onUpdatePlaylistName, isSearching, searchQuery, searchResults, onSelectSongFromSearch, likedSongIds, onToggleLikeSong }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(playlist.name);

  useEffect(() => {
    setEditedName(playlist.name);
    setIsEditingName(false);
  }, [playlist.id, playlist.name]);

  const handleNameUpdate = () => {
    if (editedName.trim() && editedName.trim() !== playlist.name) {
      onUpdatePlaylistName(editedName.trim());
    } else {
      setEditedName(playlist.name);
    }
    setIsEditingName(false);
  };

  if (isSearching) {
    return (
      <div className="w-full md:w-3/4 bg-spotify-darkgray rounded-lg overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-6">
            {searchResults.length > 0 ? `Results for "${searchQuery}"` : `No results found for "${searchQuery}"`}
          </h1>
          
          <div className="grid grid-cols-12 gap-4 text-sm border-b border-spotify-lightgray pb-2 mb-4 px-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-7">TITLE</div>
            <div className="col-span-4 text-left">ALBUM</div>
          </div>
          
          {searchResults.map((song, index) => {
            const isPlaying = currentSong?.id === song.id;
            return (
              <button
                key={song.id}
                onClick={() => onSelectSongFromSearch(song)}
                className={`grid grid-cols-12 gap-4 items-center p-2 rounded-md hover:bg-spotify-lightgray group w-full text-left ${isPlaying ? 'text-spotify-green' : 'text-white'}`}
              >
                <div className="col-span-1 text-center text-spotify-gray group-hover:hidden">
                  {isPlaying ? <PlayIcon className="text-spotify-green" /> : index + 1}
                </div>
                <div className="col-span-1 text-center text-spotify-gray hidden group-hover:block">
                   <PlayIcon />
                </div>
  
                <div className="col-span-7 flex items-center gap-4">
                  <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-sm"/>
                  <div>
                    <p className="font-semibold truncate">{song.title}</p>
                    <p className="text-xs text-spotify-gray">{song.artist}</p>
                  </div>
                </div>
                <div className="col-span-4 text-spotify-gray truncate text-left">{song.album}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-3/4 bg-spotify-darkgray rounded-lg overflow-y-auto">
      <div className="p-6 bg-gradient-to-b from-purple-800 via-spotify-darkgray to-spotify-darkgray">
        <div className="flex items-end gap-6">
          <img src={playlist.coverArt} alt={playlist.name} className="w-48 h-48 rounded-lg shadow-2xl" />
          <div>
            <p className="text-sm font-bold">PLAYLIST</p>
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameUpdate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameUpdate();
                  if (e.key === 'Escape') {
                    setEditedName(playlist.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                onFocus={(e) => e.target.select()}
                className="text-5xl md:text-7xl font-bold text-white tracking-tighter bg-spotify-lightgray outline-none border-0 w-full rounded-md p-1 -ml-1"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                className="text-5xl md:text-7xl font-bold text-white tracking-tighter cursor-pointer"
                title="Click to edit name"
              >
                {playlist.name}
              </h1>
            )}
            <p className="mt-2 text-sm">A collection of great songs.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-4 text-sm border-b border-spotify-lightgray pb-2 mb-4 px-2">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6">TITLE</div>
          <div className="col-span-3">ALBUM</div>
          <div className="col-span-2 text-right"><ClockIcon /></div>
        </div>
        
        {playlist.songs.map((song, index) => {
          const isPlaying = currentSong?.id === song.id;
          const isLiked = likedSongIds.has(song.id);
          return (
            <button
              key={song.id}
              onClick={() => onSelectSong(index)}
              className={`grid grid-cols-12 gap-4 items-center p-2 rounded-md hover:bg-spotify-lightgray group ${isPlaying ? 'text-spotify-green' : 'text-white'}`}
            >
              <div className="col-span-1 text-center text-spotify-gray group-hover:hidden">
                {isPlaying ? <PlayIcon className="text-spotify-green" /> : index + 1}
              </div>
              <div className="col-span-1 text-center text-spotify-gray hidden group-hover:block">
                 <PlayIcon />
              </div>

              <div className="col-span-6 flex items-center gap-4">
                <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-sm"/>
                <div>
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-xs text-spotify-gray">{song.artist}</p>
                </div>
              </div>
              <div className="col-span-3 text-spotify-gray truncate">{song.album}</div>
              <div className="col-span-2 text-spotify-gray flex items-center justify-end gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLikeSong(song); }}
                    aria-label={isLiked ? `Unlike ${song.title}` : `Like ${song.title}`}
                    className={`transition-colors ${isLiked ? 'text-spotify-green' : 'text-spotify-gray opacity-0 group-hover:opacity-100 hover:text-white'}`}
                >
                    {isLiked ? <SolidHeartIcon /> : <HeartIcon />}
                </button>
                <div className="text-right relative">
                    <span className="opacity-100 group-hover:opacity-0 transition-opacity">{song.duration}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemoveSong(song.id); }}
                        aria-label={`Remove ${song.title} from playlist`}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-spotify-gray hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};