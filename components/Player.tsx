import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import { PlayIcon, PauseIcon, NextIcon, PrevIcon, VolumeHighIcon, VolumeMediumIcon, VolumeLowIcon, VolumeMuteIcon, ShuffleIcon, RepeatIcon } from './Icons';
import { getSongFromDB } from '../services/db';

interface PlayerProps {
  song: Song | null;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
  isShuffle: boolean;
  onToggleShuffle: (shuffle: boolean) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds === 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const Player: React.FC<PlayerProps> = ({ song, onNext, onPrev, onEnded, isShuffle, onToggleShuffle }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let objectUrl: string | null = null;

    const setupAudio = async () => {
        if (song) {
            let srcToPlay = song.audioSrc;
            if (song.audioSrc.startsWith('indexeddb:')) {
                const songId = song.audioSrc.substring(10);
                try {
                    const file = await getSongFromDB(songId);
                    if (file) {
                        objectUrl = URL.createObjectURL(file);
                        srcToPlay = objectUrl;
                    } else {
                        console.error("Could not find song in DB:", songId);
                        // Can't play, so just return
                        setIsPlaying(false);
                        return;
                    }
                } catch (error) {
                    console.error("Error loading song from DB:", error);
                    setIsPlaying(false);
                    return;
                }
            }

            // Don't reset time if it's the same song source,
            // but do if the underlying blob URL changed for the same song ID
            if (audio.src !== srcToPlay) {
              audio.src = srcToPlay;
              setCurrentTime(0);
            }
            audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Audio play failed:", e));
        } else {
            audio.pause();
            audio.src = '';
            setCurrentTime(0);
            setDuration(0);
            setIsPlaying(false);
        }
    };
    
    setupAudio();

    return () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
        setIsPlaying(false);
        onEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !song) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      setIsPlaying(true);
    }
  }, [isPlaying, song]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
  };

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeMuteIcon />;
    if (volume < 0.33) return <VolumeLowIcon />;
    if (volume < 0.66) return <VolumeMediumIcon />;
    return <VolumeHighIcon />;
  };

  return (
    <div className="bg-spotify-lightgray h-24 rounded-lg p-4 flex items-center justify-between text-white">
      <audio ref={audioRef} />
      <div className="w-1/4 flex items-center gap-4">
        {song ? (
          <>
            <img src={song.coverArt} alt={song.title} className="w-14 h-14 rounded-md" />
            <div>
              <p className="font-semibold text-sm">{song.title}</p>
              <p className="text-xs text-spotify-gray">{song.artist}</p>
            </div>
          </>
        ) : (
             <div className="w-14 h-14 bg-spotify-darkgray rounded-md flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-spotify-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
             </div>
        )}
      </div>

      <div className="w-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-6">
          <button onClick={() => onToggleShuffle(!isShuffle)} className={`${isShuffle ? 'text-spotify-green' : 'text-spotify-gray'} hover:text-white`}>
            <ShuffleIcon />
          </button>
          <button onClick={onPrev} className="text-spotify-gray hover:text-white"><PrevIcon /></button>
          <button onClick={togglePlayPause} className="bg-white text-black rounded-full p-2 hover:scale-105" disabled={!song}>
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>
          <button onClick={onNext} className="text-spotify-gray hover:text-white"><NextIcon /></button>
          <button className="text-spotify-gray hover:text-white"><RepeatIcon /></button>
        </div>
        <div className="w-full flex items-center gap-2 text-xs">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-spotify-gray rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#1DB954' }}
            disabled={!song}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="w-1/4 flex items-center justify-end gap-2">
        <VolumeIcon />
        <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-spotify-gray rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#1DB954' }}
        />
      </div>
    </div>
  );
};
