
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; // "m:ss" format
  coverArt: string;
  audioSrc: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  coverArt: string;
}
