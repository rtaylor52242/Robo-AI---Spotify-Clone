import type { Playlist } from './types';

export const LIKED_SONGS_PLAYLIST_ID = 'liked-songs';

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: LIKED_SONGS_PLAYLIST_ID,
    name: 'Liked Songs',
    coverArt: 'https://misc.scdn.co/liked-songs/liked-songs-640.png',
    songs: [],
  }
];