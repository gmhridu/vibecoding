"use client";

import React, { useCallback, useState } from 'react';
import { Button } from './button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    if (disabled) return;

    setIsUploading(true);

    try {
      // Convert file to base64 for demo purposes
      // In production, you'd upload to a service like Cloudinary, AWS S3, etc.
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange(base64);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      console.error('Error uploading file:', error);
    }
  };

  const handleRemove = () => {
    onChange(null);
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
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 mb-2" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop image here</p>
              <p className="text-xs text-zinc-500">or click to browse</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
