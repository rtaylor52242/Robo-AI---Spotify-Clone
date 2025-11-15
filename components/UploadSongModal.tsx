import React, { useState } from 'react';

interface UploadSongModalProps {
  onClose: () => void;
  onUpload: (songDetails: { title: string; artist: string; album: string; audioFile: File }) => void;
}

export const UploadSongModal: React.FC<UploadSongModalProps> = ({ onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('audio/')) {
        if(!title){
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
        setError('');
        setAudioFile(selectedFile);
      } else {
        setError('Please select a valid audio file.');
        setAudioFile(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !album || !audioFile) {
      setError('All fields and a file are required.');
      return;
    }
    
    onUpload({ title, artist, album, audioFile });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-spotify-lightgray p-8 rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">Upload a Song</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-spotify-gray mb-1">Title</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-spotify-darkgray rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-spotify-green" required />
          </div>
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-spotify-gray mb-1">Artist</label>
            <input type="text" id="artist" value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-spotify-darkgray rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-spotify-green" required />
          </div>
          <div>
            <label htmlFor="album" className="block text-sm font-medium text-spotify-gray mb-1">Album</label>
            <input type="text" id="album" value={album} onChange={e => setAlbum(e.target.value)} className="w-full bg-spotify-darkgray rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-spotify-green" required />
          </div>
          <div>
            <label htmlFor="audio-file" className="block text-sm font-medium text-spotify-gray mb-1">Audio File</label>
            <input type="file" id="audio-file" accept="audio/*" onChange={handleFileChange} className="w-full text-sm text-spotify-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-spotify-green file:text-white hover:file:bg-opacity-80" required />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-full text-white font-semibold hover:bg-spotify-darkgray">Cancel</button>
            <button type="submit" className="bg-spotify-green py-2 px-6 rounded-full text-white font-bold hover:opacity-80 disabled:opacity-50">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
};
