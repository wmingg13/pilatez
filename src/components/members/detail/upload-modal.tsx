// src/components/members/detail/upload-modal.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Portal } from "@/components/ui/portal";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewOption = "Front" | "Back" | "Left" | "Right";
const VIEWS: ViewOption[] = ["Front", "Back", "Left", "Right"];

interface Props {
  open: boolean;
  defaultView: string;
  memberId: string;
  onClose: () => void;
  onUploaded?: () => void; // called after successful upload so parent can refresh
}

export function UploadModal({ open, defaultView, memberId, onClose, onUploaded }: Props) {
  const [selectedView, setSelectedView] = useState<ViewOption>("Front");
  const [file, setFile]                 = useState<File | null>(null);
  const [preview, setPreview]           = useState<string | null>(null);
  const [isDragOver, setIsDragOver]     = useState(false);
  const [remark, setRemark]             = useState("");
  const [isPending, setIsPending]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync view when defaultView changes
  useEffect(() => {
    if (VIEWS.includes(defaultView as ViewOption)) {
      setSelectedView(defaultView as ViewOption);
    }
  }, [defaultView, open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setRemark("");
      setIsDragOver(false);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, etc.).");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  async function handleSubmit() {
    if (!file) { toast.error("Please select an image."); return; }

    setIsPending(true);
    try {
      const form = new FormData();
      form.append("file",     file);
      form.append("memberId", memberId);
      form.append("section",  selectedView.toLowerCase());
      form.append("remark",   remark.trim());

      const res  = await fetch("/api/photos/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message ?? "Upload failed. Please try again.");
        return;
      }

      toast.success(`${selectedView} image uploaded successfully.`);
      onUploaded?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: open ? "flex" : "none",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Backdrop */}
        <div
          style={{ position: "absolute", inset: 0, background: "rgba(45,43,69,0.4)" }}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "relative", zIndex: 1 }}
          className="bg-white rounded-2xl border border-[#e0ddd5] w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ede8]">
            <div className="text-sm font-medium text-[#2d2b45]">Upload image</div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#a09aad] hover:text-[#2d2b45] hover:bg-[#f5f3f0] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* View selector */}
            <div>
              <div className="text-xs text-[#7a7887] mb-2 font-medium">View section</div>
              <div className="flex gap-2">
                {VIEWS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedView(v)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                      selectedView === v
                        ? "bg-[#4a3d72] text-white border-[#4a3d72]"
                        : "bg-white text-[#7a7887] border-[#e0ddd5] hover:border-[#4a3d72] hover:text-[#4a3d72]"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone / Preview */}
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                  isDragOver
                    ? "border-[#4a3d72] bg-[#f5f3fb]"
                    : "border-[#d0cdd8] bg-[#faf9f7] hover:border-[#4a3d72] hover:bg-[#f5f3fb]"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-[#f0edf8] flex items-center justify-center">
                  <Upload className="h-5 w-5 text-[#4a3d72]" />
                </div>
                <div className="text-xs text-[#7a7887]">
                  Drop image here, or{" "}
                  <span className="text-[#4a3d72] underline underline-offset-2">browse files</span>
                </div>
                <div className="text-[10px] text-[#c0bcc8]">PNG, JPG up to 10MB</div>
              </div>
            ) : (
              <div className="h-36 rounded-xl border border-[#e0ddd5] overflow-hidden bg-[#f0edf8] flex items-center justify-center relative">
                {preview
                  ? <img src={preview} alt="preview" className="h-full w-full object-cover" />
                  : <ImageIcon className="h-8 w-8 text-[#c4bdd8]" />
                }
                <div className="absolute bottom-0 inset-x-0 bg-[#2d2b45]/60 px-3 py-2 flex items-center justify-between">
                  <span className="text-white text-[10px] truncate">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="text-white/70 hover:text-white text-[10px] underline ml-2 flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {/* Remark */}
            <div>
              <div className="text-xs text-[#7a7887] font-medium mb-1">
                Remark <span className="text-[#a09aad] font-normal">(optional)</span>
              </div>
              <div className="text-[10px] text-[#c0bcc8] mb-2">
                Add a note about posture, session context, or conditions.
              </div>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={2}
                placeholder="e.g. Standing upright, arms relaxed at sides…"
                className="w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#f0ede8] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-[#e0ddd5] text-xs text-[#7a7887] hover:bg-[#f5f3f0] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || isPending}
              className="px-5 py-2 rounded-full bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPending ? "Uploading…" : "Save image"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}