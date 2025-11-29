'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadType: string;
  description: string | null;
  createdAt: string;
}

interface FileUploadProps {
  jobId?: string;
  uploadType?: 'JOB_DOCUMENT' | 'COMPANY_LOGO' | 'CHAT_ATTACHMENT' | 'OTHER';
  onUploadComplete?: (uploads: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  jobId,
  uploadType = 'OTHER',
  onUploadComplete,
  multiple = false,
  accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
  maxSize = 10,
}: FileUploadProps) {
  const tokens = useAuthTokens();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxBytes = maxSize * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxBytes) {
        setError(`Fajl "${file.name}" je prevelik. Maksimalna velicina je ${maxSize}MB`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const newUploads: UploadedFile[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (jobId) formData.append('jobId', jobId);
        formData.append('uploadType', uploadType);

        const response = await fetch(`${API_URL}/api/uploads`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `Greska pri uploadu fajla ${file.name}`);
        }

        newUploads.push(data.data.upload);
      }

      setUploadedFiles((prev) => [...prev, ...newUploads]);
      onUploadComplete?.(newUploads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri uploadu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      uploadFiles(validFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        const validFiles = validateFiles(e.dataTransfer.files);
        uploadFiles(validFiles);
      }
    },
    [jobId, uploadType, tokens?.accessToken]
  );

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== uploadId));
      }
    } catch (err) {
      console.error('Error deleting upload:', err);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-4xl">📤</div>
          <p className="text-gray-600">
            {isDragging
              ? 'Pustite fajlove ovde'
              : isUploading
              ? 'Upload u toku...'
              : 'Prevucite fajlove ovde ili kliknite za izbor'}
          </p>
          <p className="text-xs text-gray-400">
            Maksimalna velicina: {maxSize}MB • Dozvoljeni tipovi: slike, PDF, Word, Excel
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploadovani fajlovi:</p>
          {uploadedFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`${API_URL}${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Preuzmi
                  </a>
                  <button
                    onClick={() => handleDeleteUpload(file.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Obrisi
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Simpler version for displaying existing uploads
interface FileListProps {
  files: UploadedFile[];
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export function FileList({ files, onDelete, showDelete = true }: FileListProps) {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">Nema uploadovanih fajlova</p>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{getFileIcon(file.fileType)}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.fileSize)}
                {file.description && ` • ${file.description}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`${API_URL}${file.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Preuzmi
            </a>
            {showDelete && onDelete && (
              <button
                onClick={() => onDelete(file.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Obrisi
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
