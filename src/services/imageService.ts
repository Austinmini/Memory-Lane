import * as FileSystem from 'expo-file-system/legacy';

const MEMORIES_DIR_NAME = 'memories';

/**
 * Ensures the internal sandboxed directory for memory photos exists.
 */
export async function ensureMemoriesDirectoryExists(): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('FileSystem.documentDirectory is null on this device');
  }

  const memoriesDir = `${docDir}${MEMORIES_DIR_NAME}/`;
  const dirInfo = await FileSystem.getInfoAsync(memoriesDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(memoriesDir, { intermediates: true });
  }

  return memoriesDir;
}

/**
 * Saves a picked image URI (e.g. from photo picker cache) permanently into the app's internal sandbox.
 * Returns the persistent file:// URI.
 */
export async function saveImageToSandbox(sourceUri: string, id: string): Promise<string> {
  if (!sourceUri || sourceUri.startsWith('seed_') || sourceUri.startsWith('http')) {
    return sourceUri;
  }

  const memoriesDir = await ensureMemoriesDirectoryExists();
  const fileExtMatch = sourceUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  const ext = fileExtMatch ? fileExtMatch[1] : 'jpg';
  const destinationUri = `${memoriesDir}${id}.${ext}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

/**
 * Safely deletes a stored image file from the app sandbox if it exists.
 */
export async function deleteSandboxImage(imageUri: string): Promise<void> {
  if (!imageUri || imageUri.startsWith('seed_') || imageUri.startsWith('http')) {
    return;
  }

  const fileInfo = await FileSystem.getInfoAsync(imageUri);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(imageUri, { idempotent: true });
  }
}