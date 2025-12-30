import { create } from 'zustand';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadProgressItem {
    id: string;
    progress: number; // 0-100
    status: UploadStatus;
    error?: string;
}

interface UploadProgressState {
    uploads: Record<string, UploadProgressItem>;
    setProgress: (id: string, progress: number) => void;
    setStatus: (id: string, status: UploadStatus, error?: string) => void;
    addUpload: (id: string) => void;
    removeUpload: (id: string) => void;
    getUpload: (id: string) => UploadProgressItem | undefined;
}

export const useUploadProgress = create<UploadProgressState>((set, get) => ({
    uploads: {},

    addUpload: (id: string) => set((state) => ({
        uploads: {
            ...state.uploads,
            [id]: { id, progress: 0, status: 'pending' }
        }
    })),

    removeUpload: (id: string) => set((state) => {
        const { [id]: _, ...rest } = state.uploads;
        return { uploads: rest };
    }),

    setProgress: (id: string, progress: number) => set((state) => ({
        uploads: {
            ...state.uploads,
            [id]: {
                ...state.uploads[id],
                progress,
                status: progress === 100 ? 'done' : 'uploading'
            }
        }
    })),

    setStatus: (id: string, status: UploadStatus, error?: string) => set((state) => ({
        uploads: {
            ...state.uploads,
            [id]: {
                ...state.uploads[id],
                status,
                error,
                progress: status === 'done' ? 100 : state.uploads[id]?.progress || 0
            }
        }
    })),

    getUpload: (id: string) => get().uploads[id]
}));

// Helper function to upload with progress tracking
export async function uploadWithProgress(
    id: string,
    file: File,
    onProgress: (progress: number) => void,
    onSuccess: (serverFileName: string) => void,
    onError: (error: string) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    onSuccess(data.fileName);
                    resolve();
                } catch (e) {
                    onError('Failed to parse response');
                    reject(e);
                }
            } else {
                onError(`Upload failed: ${xhr.status}`);
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            onError('Network error');
            reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
            onError('Upload cancelled');
            reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
    });
}
