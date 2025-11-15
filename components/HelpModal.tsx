import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-spotify-lightgray p-8 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">How to Use Robo AI Player</h2>
            <button onClick={onClose} className="text-spotify-gray hover:text-white font-bold text-2xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6 text-spotify-gray text-sm">
            <section>
                <h3 className="font-bold text-white text-lg mb-2">🤖 Generate Playlists with AI</h3>
                <p>
                    Use the "Generate Playlist" feature in the sidebar. Simply type a description of the music you want to hear (like "upbeat indie rock for a road trip" or "lo-fi beats for studying"), and our AI will create a new playlist with a fitting name for you to fill with music.
                </p>
            </section>

            <section>
                <h3 className="font-bold text-white text-lg mb-2">🎵 Upload Your Music</h3>
                <p>
                    Click the <span className="font-bold text-white text-lg inline-block align-middle mx-1">+</span> icon at the top of "Your Library" to open the upload dialog. You'll need to provide a title, artist, album, and select an audio file from your device. Once uploaded, the song will be added to your currently selected playlist.
                </p>
            </section>
            
            <section>
                <h3 className="font-bold text-white text-lg mb-2">📚 Manage Your Library</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><span className="font-semibold text-white">Play a Song:</span> Click on any song in a playlist to start playing it.</li>
                    <li><span className="font-semibold text-white">Like a Song:</span> Hover over a song and click the ♡ icon to add it to your "Liked Songs" playlist.</li>
                    <li><span className="font-semibold text-white">Remove a Song:</span> Hover over a song and click the trash can icon (🗑️) to remove it from the current playlist.</li>
                    <li><span className="font-semibold text-white">Delete a Playlist:</span> Hover over a playlist in the sidebar and click the trash can icon (🗑️) that appears on the right. Note: "Liked Songs" cannot be deleted.</li>
                     <li><span className="font-semibold text-white">Rename a Playlist:</span> Simply click on the playlist's title in the main view to edit it.</li>
                </ul>
            </section>
            
            <section>
                <h3 className="font-bold text-white text-lg mb-2">🔍 Search</h3>
                <p>
                    Use the search bar in the top-left to find any song across all of your playlists by title, artist, or album name.
                </p>
            </section>

            <div className="flex justify-end pt-4">
                <button onClick={onClose} className="bg-spotify-green py-2 px-6 rounded-full text-white font-bold hover:opacity-80">
                    Got it!
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
