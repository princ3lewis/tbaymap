import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 8;

export const validateMediaFiles = (files: File[]) => {
  if (files.length > MAX_FILES) {
    throw new Error(`You can upload up to ${MAX_FILES} images.`);
  }
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image uploads are supported right now.');
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      throw new Error(`Image ${file.name} exceeds ${MAX_FILE_SIZE_MB}MB.`);
    }
  });
};

export const uploadEventMedia = async ({
  eventId,
  files
}: {
  eventId: string;
  files: File[];
}) => {
  if (!storage) {
    throw new Error('firebase-not-configured');
  }
  validateMediaFiles(files);
  const uploads = files.map(async (file) => {
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const storageRef = ref(storage, `events/${eventId}/${filename}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });
  return Promise.all(uploads);
};
