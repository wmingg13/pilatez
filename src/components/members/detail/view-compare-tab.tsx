// src/components/members/detail/view-compare-tab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, ImageOff, Maximize2, X, GitCompare, Loader2 } from "lucide-react";
import { Portal } from "@/components/ui/portal";
import { getMemberPhotosBySection } from "@/actions/photo-actions";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  section: string;
  fileName: string;
  remark: string | null;
  uploadedAt: Date;
  url: string;
  drivePath: string;
}

// ─── Single-image fullscreen lightbox ────────────────────────────────────────

function Lightbox({ photo, view, onClose }: { photo: Photo; view: string; onClose: () => void }) {
  return (
    <Portal>
      <div
        style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", flexDirection:"column" }}
        onClick={onClose}
      >
        <div style={{ position:"absolute", inset:0, background:"rgba(20,18,36,0.96)" }} />

        <div
          style={{ position:"relative", zIndex:1 }}
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="text-white text-sm font-medium">{view} view</div>
            <div className="text-white/50 text-xs mt-0.5">{formatDate(photo.uploadedAt)}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div style={{ position:"relative", zIndex:1, flex:1 }} className="flex items-center justify-center px-8">
          <img
            onClick={(e) => e.stopPropagation()}
            src={photo.url}
            alt={`${view} view`}
            className="max-w-full max-h-[70vh] rounded-2xl object-contain"
          />
        </div>

        {photo.remark && (
          <div style={{ position:"relative", zIndex:1 }} className="px-6 py-4 flex-shrink-0 text-center">
            <div className="text-white/70 text-sm">"{photo.remark}"</div>
          </div>
        )}
        <div style={{ position:"relative", zIndex:1 }} className="pb-4 text-center flex-shrink-0">
          <div className="text-white/25 text-[10px]">Click outside the image to close</div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Side-by-side compare lightbox ───────────────────────────────────────────

function CompareLightbox({
  photoA, photoB, view, onClose,
}: {
  photoA: Photo; photoB: Photo; view: string; onClose: () => void;
}) {
  return (
    <Portal>
      <div
        style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", flexDirection:"column" }}
        onClick={onClose}
      >
        <div style={{ position:"absolute", inset:0, background:"rgba(20,18,36,0.97)" }} />

        {/* Top bar */}
        <div
          style={{ position:"relative", zIndex:1 }}
          className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-white/50" />
            <span className="text-white text-sm font-medium">{view} view — side by side comparison</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Two panels — use explicit calc heights so images can size against a concrete px value */}
        {/* Top bar is ~52px, hint footer is ~28px, two per-panel headers are ~38px each */}
        <div
          style={{ position:"relative", zIndex:1, flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", overflow:"hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { photo: photoA, badge: photos_badge(photoA, photoB), badgeCls: "bg-[#4a3d72] text-white/80", side: "left" },
            { photo: photoB, badge: photos_badge(photoB, photoA), badgeCls: "bg-white/10 text-white/60", side: "right" },
          ].map(({ photo, badge, badgeCls, side }) => (
            <div
              key={side}
              style={{ display:"flex", flexDirection:"column", borderRight: side === "left" ? "1px solid rgba(255,255,255,0.1)" : "none" }}
            >
              {/* Per-panel header ~38px */}
              <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 20px" }}>
                <span className="text-white/80 text-xs font-medium">{formatDate(photo.uploadedAt)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
              </div>

              {/* Image area — height = 100vh minus topbar(52) minus hint(28) minus panel-header(38) minus remark(~32) */}
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px 16px", minHeight:0 }}>
                <img
                  src={photo.url}
                  alt={`${view} — ${formatDate(photo.uploadedAt)}`}
                  style={{ maxWidth:"100%", maxHeight:"calc(100vh - 180px)", objectFit:"contain", borderRadius:"12px" }}
                />
              </div>

              {/* Remark */}
              {photo.remark && (
                <div style={{ flexShrink:0, padding:"0 20px 16px", textAlign:"center" }}>
                  <div className="text-white/50 text-xs">"{photo.remark}"</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ position:"relative", zIndex:1, flexShrink:0, paddingBottom:"10px", textAlign:"center" }}>
          <div className="text-white/20 text-[10px]">Click anywhere outside to close</div>
        </div>
      </div>
    </Portal>
  );
}

function photos_badge(target: Photo, other: Photo): string {
  const tDate = new Date(target.uploadedAt).getTime();
  const oDate = new Date(other.uploadedAt).getTime();
  if (tDate > oDate) return "Latest";
  if (tDate < oDate) return "Earlier";
  return "Same date";
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ViewCompareTabProps {
  memberId: string;
  view: string;
  onUpload: () => void;
  refreshKey?: number;
}

export function ViewCompareTab({ memberId, view, onUpload, refreshKey }: ViewCompareTabProps) {
  const [photos, setPhotos]           = useState<Photo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [dateA, setDateA]             = useState("");
  const [dateB, setDateB]             = useState("");
  const [lightbox, setLightbox]       = useState<Photo | null>(null);
  const [comparing, setComparing]     = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMemberPhotosBySection(memberId, view);
      setPhotos(data);
      setDateA(data[1]?.id ?? "");  // Before = second latest
      setDateB(data[0]?.id ?? "");  // After  = latest
    } finally {
      setLoading(false);
    }
  }, [memberId, view]);

  useEffect(() => { loadPhotos(); }, [loadPhotos, refreshKey]);

  const hasImages = photos.length > 0;
  const photoA    = photos.find((p) => p.id === dateA);
  const photoB    = photos.find((p) => p.id === dateB);
  const canCompare = photos.length >= 2 && !!(photoA && photoB);

  const inputCls = "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";

  // ── Single image card ──
  function ImageCard({ photo, label, badge, badgeColor }: {
    photo: Photo | undefined; label: string; badge?: string; badgeColor?: string;
  }) {
    if (!photo) {
      return (
        <div className="rounded-xl border border-[#e0ddd5] overflow-hidden">
          <div className="px-4 py-3 bg-[#faf9f7] border-b border-[#f0ede8]">
            <span className="text-xs font-medium text-[#2d2b45]">{label}</span>
          </div>
          <div className="h-48 bg-[#faf9f7] flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#f0edf8] flex items-center justify-center">
              <ImageOff className="h-5 w-5 text-[#c4bdd8]" />
            </div>
            <div className="text-xs text-[#c0bcc8]">Select a date to compare</div>
          </div>
          <div className="px-4 py-3 bg-[#faf9f7] border-t border-[#f0ede8]">
            <div className="text-xs text-[#c0bcc8]">No image selected</div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[#e0ddd5] overflow-hidden">
        <div className="px-4 py-3 bg-[#faf9f7] border-b border-[#f0ede8] flex items-center justify-between">
          <span className="text-xs font-medium text-[#2d2b45]">{label}</span>
          {badge && (
            <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium", badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        <div
          className="relative group cursor-zoom-in overflow-hidden bg-[#f5f3f0]"
          style={{ aspectRatio: "3/4" }}
          onClick={() => setLightbox(photo)}
        >
          <img src={photo.url} alt={`${view} view`} className="h-full w-full object-contain" />
          <div className="absolute inset-0 bg-[#2d2b45]/0 group-hover:bg-[#2d2b45]/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-[#4a3d72]" />
              <span className="text-[11px] font-medium text-[#4a3d72]">View full screen</span>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-[#faf9f7] border-t border-[#f0ede8]">
          {photo.remark && <div className="text-xs text-[#2d2b45]">"{photo.remark}"</div>}
          <div className="text-[10px] text-[#a09aad] mt-1">Uploaded {formatDate(photo.uploadedAt)}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e0ddd5] overflow-hidden">
        {/* Panel header */}
        <div className="px-6 py-4 border-b border-[#f0ede8] flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#2d2b45]">{view} view</div>
            <div className="text-xs text-[#a09aad] mt-0.5">
              {loading ? "Loading…" : hasImages ? "Click an image to view full screen" : "No images uploaded yet"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Compare button — only shown when both panels have images */}
            {canCompare && (
              <button
                onClick={() => setComparing(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-[#f5f3fb] border border-[#c4bdd8] text-[#4a3d72] text-xs font-medium px-4 py-2 rounded-full transition-colors"
              >
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </button>
            )}
            <button
              onClick={onUpload}
              className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {hasImages ? "Upload image" : "Upload first image"}
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#c4bdd8] animate-spin" />
            </div>
          ) : !hasImages ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#f0edf8] flex items-center justify-center">
                <ImageOff className="h-6 w-6 text-[#c4bdd8]" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-[#2d2b45] mb-1">No {view.toLowerCase()} images yet</div>
                <div className="text-xs text-[#a09aad] mb-4">Upload the first image to start tracking progress for this view.</div>
                <button
                  onClick={onUpload}
                  className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium px-5 py-2.5 rounded-full transition-colors mx-auto"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload first image
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[10px] text-[#a09aad] uppercase tracking-widest font-medium mb-3">
                Compare images
              </div>

              {/* Date selectors */}
              <div className="flex items-end gap-3 mb-5">
                <div className="flex-1">
                  <div className="text-xs text-[#a09aad] mb-1.5">Before</div>
                  <select value={dateA} onChange={(e) => setDateA(e.target.value)} className={inputCls}>
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>{formatDate(p.uploadedAt)}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-[#c0bcc8] font-medium pb-2">vs</div>
                <div className="flex-1">
                  <div className="text-xs text-[#a09aad] mb-1.5">After</div>
                  <select value={dateB} onChange={(e) => setDateB(e.target.value)} className={inputCls}>
                    <option value="">— Select date —</option>
                    {photos.filter((p) => p.id !== dateA).map((p) => (
                      <option key={p.id} value={p.id}>{formatDate(p.uploadedAt)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image cards */}
              <div className="grid grid-cols-2 gap-4">
                <ImageCard
                  photo={photoA}
                  label={photoA ? `${view} — ${formatDate(photoA.uploadedAt)}` : "Before"}
                  badge={photos[0]?.id === dateA ? "Latest" : "Earlier"}
                  badgeColor="bg-[#f0edf8] text-[#4a3d72]"
                />
                <ImageCard
                  photo={photoB}
                  label={photoB ? `${view} — ${formatDate(photoB.uploadedAt)}` : "Select a date"}
                  badge={photoB ? (photos[0]?.id === dateB ? "Latest" : "Earlier") : undefined}
                  badgeColor="bg-[#eaf3f0] text-[#0f6e56]"
                />
              </div>


            </>
          )}
        </div>
      </div>

      {/* Single image lightbox */}
      {lightbox && (
        <Lightbox photo={lightbox} view={view} onClose={() => setLightbox(null)} />
      )}

      {/* Side-by-side compare lightbox */}
      {comparing && photoA && photoB && (
        <CompareLightbox
          photoA={photoA}
          photoB={photoB}
          view={view}
          onClose={() => setComparing(false)}
        />
      )}
    </>
  );
}