'use client';

import React, { useState, useRef } from 'react';
import { Upload, Trash2, X } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import { uploadAndSavePhoto, deletePhotoFromSupabase } from '@/lib/realtime-sync';
import { cn } from '@/lib/utils';
import type { Photo } from '@/lib/types';

export default function PhotosPage() {
  const photos = useTeamStore((s) => s.photos);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const addPhoto = useTeamStore((s) => s.addPhoto);
  const removePhoto = useTeamStore((s) => s.removePhoto);
  const { isAdmin } = usePermissions();

  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !activeTeamId || !currentPlayerId) return;

    setUploading(true);
    setUploadCount(files.length);

    for (const file of files) {
      const uri = await uploadAndSavePhoto(file, activeTeamId, currentPlayerId);
      if (uri) {
        const photo: Photo = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          gameId: '',
          uri,
          uploadedBy: currentPlayerId,
          uploadedAt: new Date().toISOString(),
        };
        addPhoto(photo);
      }
      setUploadCount((c) => c - 1);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (photo: Photo) => {
    if (!currentPlayerId) return;
    const canDelete = isAdmin || photo.uploadedBy === currentPlayerId;
    if (!canDelete) return;
    removePhoto(photo.id);
    await deletePhotoFromSupabase(photo.id);
    if (lightboxPhoto?.id === photo.id) setLightboxPhoto(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-100">
          Photos <span className="text-slate-500 font-normal text-base">({photos.length})</span>
        </h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#67e8f9]/10 border border-[#67e8f9]/20 text-[#67e8f9] text-sm font-medium hover:bg-[#67e8f9]/20 transition-all disabled:opacity-60"
        >
          <Upload size={15} />
          {uploading ? `Uploading ${uploadCount}...` : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Upload skeleton */}
      {uploading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {Array.from({ length: uploadCount }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.05] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 && !uploading ? (
        <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No photos yet</p>
          <p className="text-slate-500 text-xs mt-1">Upload some to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => {
            const canDelete = isAdmin || photo.uploadedBy === currentPlayerId;
            return (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#0f1a2e] border border-white/10 cursor-pointer"
                onClick={() => setLightboxPhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.uri}
                  alt="Team photo"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Delete overlay */}
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/70 text-rose-400 rounded-lg p-1.5 transition-all hover:bg-rose-500/30"
                    aria-label="Delete photo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            onClick={() => setLightboxPhoto(null)}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto.uri}
            alt="Full size"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {(isAdmin || lightboxPhoto.uploadedBy === currentPlayerId) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(lightboxPhoto); }}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-xl text-sm hover:bg-rose-500/30 transition-all"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
