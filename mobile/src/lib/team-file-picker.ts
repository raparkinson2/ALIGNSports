import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export type PickedFile = {
  uri: string;
  filename: string;
  mimeType: string;
  size?: number;
};

/** Pick an image from the photo library (no videos) */
export async function pickImageFile(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: false,
    exif: false,
    base64: false,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  // Normalize HEIC/HEIF to JPEG for storage compatibility
  const rawMime = asset.mimeType ?? 'image/jpeg';
  const mimeType =
    rawMime === 'image/heic' || rawMime === 'image/heif' ? 'image/jpeg' : rawMime;
  const rawName = asset.fileName ?? `image-${Date.now()}.jpg`;
  // Ensure extension matches the MIME type we're sending
  const filename =
    mimeType === 'image/jpeg' && !rawName.match(/\.(jpg|jpeg)$/i)
      ? rawName.replace(/\.[^.]+$/, '.jpg') || `image-${Date.now()}.jpg`
      : rawName;

  return {
    uri: asset.uri,
    filename,
    mimeType,
    size: asset.fileSize,
  };
}

/** Pick a document (PDF, Word, Excel, text — no video/audio) */
export async function pickDocumentFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    filename: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size,
  };
}
