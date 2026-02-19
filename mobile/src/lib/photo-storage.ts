import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'team-photos';

/**
 * Photo Storage Service
 * Handles uploading photos to Supabase Storage for cross-device sync
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a photo to Supabase Storage
 * Converts local file URI to cloud URL
 */
export async function uploadPhotoToStorage(
  localUri: string,
  teamId: string,
  photoId: string
): Promise<UploadResult> {
  try {
    // Skip if already a cloud URL
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return { success: true, url: localUri };
    }

    console.log('PHOTO_STORAGE: Uploading photo:', photoId);

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine file extension from URI or default to jpg
    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

    // Create unique path: team-photos/teamId/photoId.ext
    const path = `${teamId}/${photoId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('PHOTO_STORAGE: Upload error:', error.message);
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    console.log('PHOTO_STORAGE: Upload success:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
  } catch (err: any) {
    console.error('PHOTO_STORAGE: Exception:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to upload photo' };
  }
}

/**
 * Delete a photo from Supabase Storage
 */
export async function deletePhotoFromStorage(
  teamId: string,
  photoId: string
): Promise<boolean> {
  try {
    // Try both jpg and png extensions
    const paths = [
      `${teamId}/${photoId}.jpg`,
      `${teamId}/${photoId}.png`,
    ];

    for (const path of paths) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (!error) {
        console.log('PHOTO_STORAGE: Deleted photo:', path);
        return true;
      }
    }

    return true; // Return true even if file wasn't found (idempotent delete)
  } catch (err) {
    console.error('PHOTO_STORAGE: Delete error:', err);
    return false;
  }
}

/**
 * Check if Supabase Storage bucket exists and is accessible
 */
export async function checkStorageBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    return !error && !!data;
  } catch {
    return false;
  }
}
