// src/components/members/detail/edit-photos-tab.tsx
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Upload, Trash2, ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMemberPhotos, deleteMemberPhoto } from "@/actions/photo-actions";
import { formatDate } from "@/lib/helpers";
import { toast } from "sonner";

interface Photo {
  id: string;
  section: string;
  fileName: string;
  remark: string | null;
  uploadedAt: Date;
  url: string;
  drivePath: string;
}

const VIEW_TAGS: Record<string, string> = {
  front: "bg-[#e8e3f2] text-[#4a3d72]",
  back:  "bg-[#d8ede8] text-[#0f6e56]",
  left:  "bg-[#f0e4d8] text-[#854f0b]",
  right: "bg-[#f0dede] text-[#991b1b]",
};

const IMG_BG: Record<string, string> = {
  front: "bg-[#eeebf5]",
  back:  "bg-[#e4f2ee]",
  left:  "bg-[#f7ede4]",
  right: "bg-[#f7e4e4]",
};

interface Props {
  memberId: string;
  onUpload: () => void;
  refreshKey?: number;
}

export function EditPhotosTab({ memberId, onUpload, refreshKey }: Props) {
  const [photos, setPhotos]       = useState<Photo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startDelete]  = useTransition();

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMemberPhotos(memberId);
      setPhotos(data);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos, refreshKey]);

  function handleDelete(photo: Photo) {
    setDeletingId(photo.id);
    startDelete(async () => {
      const result = await deleteMemberPhoto(photo.id);
      if (result.success) {
        toast.success("Photo deleted.");
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      } else {
        toast.error(result.message);
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e0ddd5] p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-medium text-[#2d2b45]">
          All uploaded photos
          {!loading && (
            <span className="ml-2 text-xs font-normal text-[#a09aad]">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} across all views
            </span>
          )}
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload new
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[#c4bdd8] animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#f0edf8] flex items-center justify-center">
            <ImageOff className="h-6 w-6 text-[#c4bdd8]" />
          </div>
          <div className="text-sm font-medium text-[#2d2b45]">No photos yet</div>
          <div className="text-xs text-[#a09aad] mb-2">Upload images to track member progress.</div>
          <button
            onClick={onUpload}
            className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload first photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-xl border border-[#e8e5dc] overflow-hidden group"
            >
              {/* Image */}
              <div className={cn("relative overflow-hidden", "aspect-square", IMG_BG[photo.section] ?? "bg-[#f5f3f0]")}>
                <span className={cn(
                  "absolute top-2 left-2 z-10 text-[9px] font-medium px-2 py-0.5 rounded-full capitalize",
                  VIEW_TAGS[photo.section] ?? "bg-[#f5f3f0] text-[#7a7887]"
                )}>
                  {photo.section}
                </span>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={isPending && deletingId === photo.id}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/90 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 disabled:opacity-60"
                  title="Delete photo"
                >
                  {isPending && deletingId === photo.id
                    ? <Loader2 className="h-3 w-3 text-red-500 animate-spin" />
                    : <Trash2 className="h-3 w-3 text-red-500" />
                  }
                </button>

                <img
                  src={photo.url}
                  alt={`${photo.section} view`}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 bg-white border-t border-[#f0ede8]">
                <div className="text-[11px] text-[#2d2b45] leading-snug line-clamp-2">
                  {photo.remark
                    ? `"${photo.remark}"`
                    : <span className="text-[#c0bcc8] italic">No remark</span>
                  }
                </div>
                <div className="text-[10px] text-[#a09aad] mt-1">{formatDate(photo.uploadedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}