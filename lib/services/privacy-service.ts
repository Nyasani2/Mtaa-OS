import * as ImageManipulator from 'expo-image-manipulator';

// GrapheneOS-inspired: Strip all GPS and device metadata from images before upload
export const stripExifData = async (uri: string): Promise<string> => {
  try {
    // Manipulating with empty actions forces a re-encode, which strips EXIF data
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [], 
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('EXIF stripping failed, using original:', error);
    return uri; // Fallback to original if it fails
  }
};

// For videos, we'll use a placeholder for now
// In production, integrate FFmpeg to strip video metadata
export const stripVideoMetadata = async (uri: string): Promise<string> => {
  console.log('Video metadata stripping not yet implemented');
  return uri;
};
