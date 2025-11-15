import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import type { Playlist, Song } from './types';
import { INITIAL_PLAYLISTS, LIKED_SONGS_PLAYLIST_ID } from './constants';
import { addSongToDB, deleteSongFromDB, cleanupOrphanedSongs, getPlaylistsFromDB, savePlaylistsToDB } from './services/db';
import { HelpModal } from './components/HelpModal';
import { HelpIcon } from './components/Icons';

const validateAndMigratePlaylists = (data: any): Playlist[] | null => {
  if (!Array.isArray(data)) {
    return null;
  }

  try {
    const migratedPlaylists = data
      .map((p: any): Playlist | null => {
        if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') {
          return null;
        }

        const playlist: Playlist = {
          id: p.id,
          name: p.name,
          coverArt: p.coverArt ?? `https://picsum.photos/seed/${encodeURIComponent(p.name)}/100/100`,
          songs: [],
        };

        if (Array.isArray(p.songs)) {
          playlist.songs = p.songs
            .map((s: any): Song | null => {
              if (!s || typeof s.id !== 'string' || typeof s.title !== 'string' || typeof s.audioSrc !== 'string') {
                return null;
              }
              const song: Song = {
                id: s.id,
                title: s.title,
                artist: s.artist ?? 'Unknown Artist',
                album: s.album ?? 'Unknown Album',
                duration: s.duration ?? '?:??',
                coverArt: s.coverArt ?? `https://picsum.photos/seed/${encodeURIComponent(s.title)}/100/100`,
                audioSrc: s.audioSrc,
              };
              return song;
            })
            .filter((s): s is Song => s !== null);
        }
        return playlist;
      })
      .filter((p): p is Playlist => p !== null);

    return migratedPlaylists;
  } catch (error) {
    console.error('Error migrating playlist data:', error);
    return null;
  }
};

const getAudioDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src);
            const duration = audio.duration;
            if (isNaN(duration)) {
                resolve('?:??');
                return;
            }
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
            resolve(`${minutes}:${seconds}`);
        };
        audio.onerror = () => {
            resolve('?:??');
        }
        audio.src = window.URL.createObjectURL(file);
    });
};

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const isSearching = searchQuery.trim() !== '';

  useEffect(() => {
    const loadPlaylists = async () => {
      setIsLoading(true);
      try {
        const savedPlaylistsFromDB = await getPlaylistsFromDB();
        const savedPlaylistsJSON = localStorage.getItem('gemini-spotify-clone-playlists');
        
        let playlistsDataToLoad: any = null;

        if (savedPlaylistsFromDB) {
            playlistsDataToLoad = savedPlaylistsFromDB;
        } else if (savedPlaylistsJSON) {
            console.log("Migrating playlists from localStorage to IndexedDB...");
            playlistsDataToLoad = JSON.parse(savedPlaylistsJSON);
            localStorage.removeItem('gemini-spotify-clone-playlists'); 
        }

        if (playlistsDataToLoad) {
          const migratedPlaylists = validateAndMigratePlaylists(playlistsDataToLoad);
          if (migratedPlaylists) { 
            if (!migratedPlaylists.some((p) => p.id === LIKED_SONGS_PLAYLIST_ID)) {
              const likedPlaylist = INITIAL_PLAYLISTS.find((p) => p.id === LIKED_SONGS_PLAYLIST_ID)!;
              setPlaylists([{...likedPlaylist, songs: []}, ...migratedPlaylists]);
            } else {
              setPlaylists(migratedPlaylists);
            }
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load or migrate playlists", e);
      } finally {
        setIsLoading(false);
      }

      setPlaylists(INITIAL_PLAYLISTS.map(p => ({...p, songs: [...p.songs]})));
    };
    loadPlaylists();
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      savePlaylistsToDB(playlists).catch(e => {
        console.error("Failed to save playlists to IndexedDB", e);
      });
    }
  }, [playlists, isLoading]);
  
  useEffect(() => {
    if (isLoading) return;

    const runCleanup = async () => {
        console.log('[DB Cleanup] Starting check for orphaned songs...');
        const validUploadedSongIds = new Set<string>();
        playlists.forEach(playlist => {
            playlist.songs.forEach(song => {
                if (song.id.startsWith('upload-')) {
                    validUploadedSongIds.add(song.id);
                }
            });
        });
        
        try {
            await cleanupOrphanedSongs(validUploadedSongIds);
        } catch (error) {
            console.error('[DB Cleanup] Failed to cleanup orphaned songs:', error);
        }
    };
    const timeoutId = setTimeout(runCleanup, 2000);

    return () => clearTimeout(timeoutId);
  }, [playlists, isLoading]);


  useEffect(() => {
    const likedPlaylist = playlists.find(p => p.id === LIKED_SONGS_PLAYLIST_ID);
    if (likedPlaylist) {
        const currentLikedIds = new Set(likedPlaylist.songs.map(s => s.id));
        setLikedSongIds(currentLikedIds);
    }
  }, [playlists]);
  
  useEffect(() => {
    // Set initial active playlist once loaded
    if (!activePlaylist && playlists.length > 0) {
      setActivePlaylist(playlists[0]);
    }
  }, [playlists, activePlaylist]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    const results: Song[] = [];
    const foundSongIds = new Set<string>();

    playlists.forEach(playlist => {
      playlist.songs.forEach(song => {
        if (
          !foundSongIds.has(song.id) && (
          song.title.toLowerCase().includes(lowercasedQuery) ||
          song.artist.toLowerCase().includes(lowercasedQuery) ||
          song.album.toLowerCase().includes(lowercasedQuery)
        )) {
          results.push(song);
          foundSongIds.add(song.id);
        }
      });
    });

    setSearchResults(results);
  }, [searchQuery, playlists]);

  const currentSong = currentSongIndex !== null && activePlaylist ? activePlaylist.songs[currentSongIndex] : null;

  const handleSelectPlaylist = useCallback((playlist: Playlist) => {
    if (activePlaylist?.id !== playlist.id) {
        setActivePlaylist(playlist);
        setCurrentSongIndex(null);
        setSearchQuery('');
    }
  }, [activePlaylist]);

  const handleSelectSong = useCallback((playlist: Playlist, songIndex: number) => {
    setActivePlaylist(playlist);
    setCurrentSongIndex(songIndex);
  }, []);

  const handleSelectSongFromSearch = (songToPlay: Song) => {
      for (const playlist of playlists) {
          const songIndex = playlist.songs.findIndex(s => s.id === songToPlay.id);
          if (songIndex !== -1) {
              handleSelectSong(playlist, songIndex);
              return;
          }
      }
  };

  const handleAddPlaylist = (newPlaylist: Playlist) => {
    setPlaylists(prev => [...prev, newPlaylist]);
    setActivePlaylist(newPlaylist);
    setCurrentSongIndex(null);
  };
  
  const handleDeletePlaylist = (playlistId: string) => {
    if (playlistId === LIKED_SONGS_PLAYLIST_ID) return;

    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updatedPlaylists);

    if (activePlaylist?.id === playlistId) {
        setActivePlaylist(updatedPlaylists[0]);
        setCurrentSongIndex(null);
    }
  };

  const handleAddSongToActivePlaylist = async (songDetails: { title: string; artist: string; album: string; audioFile: File; }) => {
    if (!activePlaylist) return;
    
    const songId = `upload-${Date.now()}-${songDetails.audioFile.name}`;

    try {
        await addSongToDB(songId, songDetails.audioFile);
        const duration = await getAudioDuration(songDetails.audioFile);

        const newSong: Song = {
            id: songId,
            title: songDetails.title,
            artist: songDetails.artist,
            album: songDetails.album,
            duration: duration,
            coverArt: `https://picsum.photos/seed/${encodeURIComponent(songDetails.title)}/100/100`,
            audioSrc: `indexeddb:${songId}`,
        };

        const updatedPlaylists = playlists.map(p => {
            if (p.id === activePlaylist.id) {
                const updatedSongs = [...p.songs, newSong];
                const updatedPlaylist = { ...p, songs: updatedSongs };
                setActivePlaylist(updatedPlaylist); // Update active playlist state directly
                return updatedPlaylist;
            }
            return p;
        });
        setPlaylists(updatedPlaylists);

    } catch (error) {
        console.error("Failed to add song to DB", error);
        alert("Failed to save the song. Please try again.");
    }
  };

  const handleRemoveSongFromActivePlaylist = (songId: string) => {
    if (!activePlaylist) return;
    const activePlaylistIndex = playlists.findIndex(p => p.id === activePlaylist.id);
    if (activePlaylistIndex === -1) return;

    const playlistToUpdate = playlists[activePlaylistIndex];
    const songToRemoveIndex = playlistToUpdate.songs.findIndex(s => s.id === songId);
    if (songToRemoveIndex === -1) return;

    const newSongs = playlistToUpdate.songs.filter(s => s.id !== songId);
    
    const updatedPlaylist = { ...playlistToUpdate, songs: newSongs };
    
    const newPlaylists = [...playlists];
    newPlaylists[activePlaylistIndex] = updatedPlaylist;

    setPlaylists(newPlaylists);
    setActivePlaylist(updatedPlaylist);

    if (currentSongIndex !== null) {
        if (currentSongIndex === songToRemoveIndex) {
            setCurrentSongIndex(null);
        } else if (currentSongIndex > songToRemoveIndex) {
            setCurrentSongIndex(currentSongIndex - 1);
        }
    }
    
    if (songId.startsWith('upload-')) {
        const isSongInOtherPlaylists = newPlaylists.some(p => p.songs.some(s => s.id === songId));
        if (!isSongInOtherPlaylists) {
            deleteSongFromDB(songId).catch(err => console.error("Failed to delete song from DB", err));
        }
    }
  };

  const handleUpdatePlaylistName = (newName: string) => {
    if (!activePlaylist) return;
    const updatedPlaylists = playlists.map(p => {
      if (p.id === activePlaylist.id) {
        return { ...p, name: newName };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);
    setActivePlaylist(prev => (prev ? { ...prev, name: newName } : null));
  };

  const handleToggleLikeSong = (songToToggle: Song) => {
    const likedPlaylistIndex = playlists.findIndex(p => p.id === LIKED_SONGS_PLAYLIST_ID);
    if (likedPlaylistIndex === -1) return;

    const likedPlaylist = playlists[likedPlaylistIndex];
    const songIsLiked = likedPlaylist.songs.some(s => s.id === songToToggle.id);
    
    const updatedLikedSongs = songIsLiked
      ? likedPlaylist.songs.filter(s => s.id !== songToToggle.id)
      : [...likedPlaylist.songs, songToToggle];

    const updatedPlaylists = [...playlists];
    updatedPlaylists[likedPlaylistIndex] = {
      ...likedPlaylist,
      songs: updatedLikedSongs,
    };

    setPlaylists(updatedPlaylists);
  };

  const playNextSong = useCallback(() => {
    if (!activePlaylist || activePlaylist.songs.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
      if (activePlaylist.songs.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * activePlaylist.songs.length);
        } while (nextIndex === currentSongIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = currentSongIndex === null ? 0 : (currentSongIndex + 1) % activePlaylist.songs.length;
    }
    setCurrentSongIndex(nextIndex);

  }, [activePlaylist, currentSongIndex, isShuffle]);

  const playPrevSong = useCallback(() => {
    if (!activePlaylist || activePlaylist.songs.length === 0) return;

    if (isShuffle) {
      playNextSong();
      return;
    }
    
    const prevIndex = currentSongIndex === null ? 0 : (currentSongIndex - 1 + activePlaylist.songs.length) % activePlaylist.songs.length;
    setCurrentSongIndex(prevIndex);
  }, [activePlaylist, currentSongIndex, isShuffle, playNextSong]);

  if (isLoading) {
    return (
        <div className="h-screen w-screen bg-spotify-black flex items-center justify-center">
            <div className="text-white text-2xl font-bold animate-pulse">Loading your library...</div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-spotify-black p-2 flex flex-col gap-2 overflow-hidden">
      <button 
        onClick={() => setIsHelpModalOpen(true)}
        className="absolute top-4 right-4 z-50 text-spotify-gray hover:text-white transition-colors"
        aria-label="Help"
      >
        <HelpIcon />
      </button>
      <div className="flex-grow flex gap-2 overflow-hidden">
        <Sidebar 
          playlists={playlists} 
          activePlaylistId={activePlaylist?.id} 
          onSelectPlaylist={handleSelectPlaylist} 
          onAddPlaylist={handleAddPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onAddSongToActivePlaylist={handleAddSongToActivePlaylist}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSearching={isSearching}
        />
        {activePlaylist && <MainContent 
          key={activePlaylist.id}
          playlist={activePlaylist} 
          onSelectSong={(songIndex) => handleSelectSong(activePlaylist, songIndex)}
          currentSong={currentSong}
          onRemoveSong={handleRemoveSongFromActivePlaylist}
          onUpdatePlaylistName={handleUpdatePlaylistName}
          isSearching={isSearching}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSelectSongFromSearch={handleSelectSongFromSearch}
          likedSongIds={likedSongIds}
          onToggleLikeSong={handleToggleLikeSong}
        />}
      </div>
      <div className="flex-shrink-0">
        <Player 
          song={currentSong} 
          onNext={playNextSong}
          onPrev={playPrevSong}
          onEnded={playNextSong}
          isShuffle={isShuffle}
          onToggleShuffle={setIsShuffle}
        />
      </div>
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
    </div>
  );
};

export default App;
