import { BACKEND_URL } from './config';

export type TeamFile = {
  id: string;
  displayName: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  created: string;
};

/** Upload a file for a team */
export async function uploadTeamFile(
  uri: string,
  filename: string,
  mimeType: string,
  teamId: string
): Promise<TeamFile> {
  const formData = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  const response = await fetch(`${BACKEND_URL}/api/team-files/upload/${teamId}`, {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as { data?: TeamFile; error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error ?? 'Upload failed');
  }
  return data.data!;
}

/** List all files for a team */
export async function fetchTeamFiles(teamId: string): Promise<TeamFile[]> {
  const response = await fetch(`${BACKEND_URL}/api/team-files/${teamId}`);
  const data = (await response.json()) as { data?: TeamFile[]; error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error ?? 'Failed to fetch files');
  }
  return data.data ?? [];
}

/** Delete a file by its storage ID */
export async function deleteTeamFile(fileId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/team-files/delete/${fileId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Delete failed');
  }
}

/** Human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a short label for a MIME type */
export function fileTypeLabel(contentType: string): string {
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType.startsWith('image/')) return 'Image';
  if (
    contentType === 'application/msword' ||
    contentType.includes('wordprocessingml')
  )
    return 'Word';
  if (
    contentType === 'application/vnd.ms-excel' ||
    contentType.includes('spreadsheetml')
  )
    return 'Excel';
  if (contentType === 'text/plain') return 'Text';
  if (contentType === 'text/csv') return 'CSV';
  return 'File';
}
