import type { Playlist } from '../types';

const DB_NAME = 'gemini-spotify-clone-db';
const DB_VERSION = 2;
const STORE_NAME = 'songs';
const PLAYLIST_STORE_NAME = 'playlists';

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
      if (!dbInstance.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
        dbInstance.createObjectStore(PLAYLIST_STORE_NAME);
      }
    };
  });
}

export async function addSongToDB(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error adding song to DB:', request.error);
      reject('Error adding song');
    };
  });
}

export async function getSongFromDB(id: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      console.error('Error getting song from DB:', request.error);
      reject('Error getting song');
    };
  });
}

export async function deleteSongFromDB(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error deleting song from DB:', request.error);
            reject('Error deleting song');
        };
    });
}

export async function cleanupOrphanedSongs(validSongIds: Set<string>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const keysRequest = store.getAllKeys();

        keysRequest.onerror = () => {
            console.error('Error getting all keys from DB:', keysRequest.error);
            reject('Error getting keys for cleanup');
        };

        keysRequest.onsuccess = () => {
            const storedKeys = keysRequest.result as string[];
            let deleteCount = 0;
            
            storedKeys.forEach(key => {
                if (key.startsWith('upload-') && !validSongIds.has(key)) {
                    console.log(`[DB Cleanup] Deleting orphaned song: ${key}`);
                    store.delete(key);
                    deleteCount++;
                }
            });
            
            if (deleteCount > 0) {
                console.log(`[DB Cleanup] Deleted ${deleteCount} orphaned song(s).`);
            } else {
                console.log(`[DB Cleanup] No orphaned songs found.`);
            }
        };

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            console.error('Error during cleanup transaction:', transaction.error);
            reject('Cleanup transaction failed');
        };
    });
}

export async function savePlaylistsToDB(playlists: Playlist[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PLAYLIST_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(PLAYLIST_STORE_NAME);
        const request = store.put(playlists, 'all_playlists');

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error saving playlists to DB:', request.error);
            reject('Error saving playlists');
        };
    });
}

export async function getPlaylistsFromDB(): Promise<Playlist[] | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PLAYLIST_STORE_NAME, 'readonly');
        const store = transaction.objectStore(PLAYLIST_STORE_NAME);
        const request = store.get('all_playlists');

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => {
            console.error('Error getting playlists from DB:', request.error);
            reject('Error getting playlists');
        };
    });
}
