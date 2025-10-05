"use client";

import React, { useCallback, useState, useRef } from 'react';
import { Button } from './button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upload } from '@imagekit/next';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith('image/'));

      if (imageFile) {
        handleFileUpload(imageFile);
      }
    },
    [disabled]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (disabled || !file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `profile-${timestamp}.${fileExtension}`;

      // Upload to ImageKit using server-side authentication
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('folder', '/profile-images/');

      const uploadResponse = await fetch('/api/upload/imagekit', {
        method: 'POST',
        body: formData,
      });

      let result;
      const responseText = await uploadResponse.text();
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('❌ Response was:', responseText);
        throw new Error(`Server returned invalid JSON. Status: ${uploadResponse.status}`);
      }

      if (!uploadResponse.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (result.url) {
        onChange(result.url);
        setUploadProgress(100);
      } else {
        console.error('❌ ERROR: No URL in result:', result);
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative w-full h-32 border-2 border-dashed border-zinc-600 rounded-lg overflow-hidden bg-zinc-800">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
        isDragOver
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-600 hover:border-zinc-500 bg-zinc-800',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
            <span className="text-sm">Uploading...</span>
            {uploadProgress > 0 && (
              <div className="w-full mt-2 px-4">
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 mt-1 block text-center">
                  {uploadProgress}%
                </span>
              </div>
            )}
          </>
        ) : uploadError ? (
          <>
            <AlertCircle className="h-8 w-8 mb-2 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-red-400">Upload failed</p>
              <p className="text-xs text-zinc-500 mb-2">{uploadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={disabled}
                className="text-xs"
              >
                Try again
              </Button>
            </div>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 mb-2" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop image here</p>
              <p className="text-xs text-zinc-500">or click to browse</p>
              <p className="text-xs text-zinc-600 mt-1">Max size: 5MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
