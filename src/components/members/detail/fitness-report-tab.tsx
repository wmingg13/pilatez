// src/components/members/detail/fitness-report-tab.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { MembershipStatus, PilatesExperience, type Instructor } from "@prisma/client";
import { FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/helpers";
import { getMemberPhotosBySection } from "@/actions/photo-actions";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberData = {
  id: string; name: string; phone: string | null; email: string | null;
  age: number | null; remarks: string | null;
  membershipStatus: MembershipStatus; joinedAt: Date;
  instructor: Instructor | null;
};

type HealthProfile = {
  pilatesExperience: PilatesExperience | null;
  fitnessGoal: string | null; physicalConsiderations: string | null;
  currentMedications: string | null; currentInjuries: string | null;
  pastSurgeries: string | null;
  condHerniatedDisk: boolean; condHighBloodPressure: boolean;
  condDiabetes: boolean; condHypoglycemia: boolean; condNumbness: boolean;
  condBackpain: boolean; condOsteoporosis: boolean; condPregnancy: boolean;
  condVertigo: boolean; condShoulderImpingement: boolean; condStenosis: boolean;
  condScoliosis: boolean; condCarpalTunnel: boolean; condCancer: boolean;
  assessmentSummary: string | null; trainingPlan: string | null;
} | null;

interface Photo {
  id: string; section: string; fileName: string;
  remark: string | null; uploadedAt: Date; url: string;
}

type SectionKey = "memberInfo" | "healthHistory" | "instructorNotes";
type ViewKey    = "front" | "back" | "left" | "right";
const VIEWS: ViewKey[] = ["front", "back", "left", "right"];

const EXPERIENCE_LABELS: Record<PilatesExperience, string> = {
  NONE: "None", LESS_THAN_6_MONTHS: "Less than 6 months",
  ONE_TO_THREE_YEARS: "1 – 3 years", MORE_THAN_3_YEARS: "More than 3 years",
};

const CONDITIONS = [
  { key: "condHerniatedDisk",       label: "Herniated disk" },
  { key: "condHighBloodPressure",   label: "High blood pressure" },
  { key: "condDiabetes",            label: "Diabetes" },
  { key: "condHypoglycemia",        label: "Hypoglycemia" },
  { key: "condNumbness",            label: "Numbness" },
  { key: "condBackpain",            label: "Backpain" },
  { key: "condOsteoporosis",        label: "Osteoporosis" },
  { key: "condPregnancy",           label: "Pregnancy (current)" },
  { key: "condVertigo",             label: "Vertigo" },
  { key: "condShoulderImpingement", label: "Shoulder impingement" },
  { key: "condStenosis",            label: "Stenosis" },
  { key: "condScoliosis",           label: "Scoliosis" },
  { key: "condCarpalTunnel",        label: "Carpal tunnel syndrome" },
  { key: "condCancer",              label: "Cancer" },
];

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors border",
          checked ? "bg-[#4a3d72] border-[#4a3d72]" : "bg-white border-[#d0cdd8] group-hover:border-[#c4bdd8]"
        )}
      >
        {checked && (
          <svg className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 10 10">
            <polyline points="2,5 4,7 8,3" />
          </svg>
        )}
      </div>
      <span className="text-sm text-[#2d2b45]">{label}</span>
    </label>
  );
}

// ─── jsPDF drawing helpers ─────────────────────────────────────────────────────

// Wraps long text into lines that fit within maxWidth
function splitText(pdf: import("jspdf").jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth) as string[];
}

// Draw a filled rectangle (section header background)
function drawRect(
  pdf: import("jspdf").jsPDF,
  x: number, y: number, w: number, h: number, color: string
) {
  pdf.setFillColor(color);
  pdf.rect(x, y, w, h, "F");
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props { member: MemberData; healthProfile: HealthProfile; }

export function FitnessReportTab({ member, healthProfile }: Props) {
  const [sections, setSections]     = useState<Record<SectionKey, boolean>>({
    memberInfo: true, healthHistory: true, instructorNotes: true,
  });
  const [imageToggles, setImageToggles] = useState<Record<ViewKey, boolean>>(
    { front: true, back: true, left: true, right: true }
  );
  const [photos, setPhotos]     = useState<Record<ViewKey, Photo[]>>(
    { front: [], back: [], left: [], right: [] }
  );
  const [photosLoading, setPhotosLoading] = useState(true);
  const [beforeSel, setBeforeSel] = useState<Record<ViewKey, string>>(
    { front: "", back: "", left: "", right: "" }
  );
  const [afterSel, setAfterSel]   = useState<Record<ViewKey, string>>(
    { front: "", back: "", left: "", right: "" }
  );
  const [generating, setGenerating] = useState(false);

  const loadPhotos = useCallback(async () => {
    setPhotosLoading(true);
    try {
      const results = await Promise.all(VIEWS.map((v) => getMemberPhotosBySection(member.id, v)));
      const map = {} as Record<ViewKey, Photo[]>;
      VIEWS.forEach((v, i) => {
        map[v] = results[i];
        setBeforeSel((s) => ({ ...s, [v]: results[i][1]?.id ?? "" }));
        setAfterSel((s)  => ({ ...s, [v]: results[i][0]?.id ?? "" }));
      });
      setPhotos(map);
    } finally {
      setPhotosLoading(false);
    }
  }, [member.id]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // ── Fetch image, downsample via canvas, return compressed JPEG base64 ───────
  // Max dimension 800px at quality 0.7 keeps each image under ~150KB
  async function fetchImageAsBase64(url: string): Promise<string> {
    const res = await fetch(`/api/photos/proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const blob = await res.blob();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX  = 800; // max dimension px
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  // ── jsPDF-based generation ─────────────────────────────────────────────────
  async function generatePDF() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");

      const pdf    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W      = 210;   // page width mm
      const H      = 297;   // page height mm
      const MARGIN = 14;
      const INNER  = W - MARGIN * 2;  // usable width
      const BRAND  = "#4a3d72";
      const DARK   = "#2d2b45";
      const MUTED  = "#888888";
      const LIGHT_BG = "#f5f3fb";

      let y = MARGIN;

      // ── helpers ──────────────────────────────────────────────────────────
      function newPageIfNeeded(needed: number) {
        if (y + needed > H - 12) {
          pdf.addPage();
          y = 26; // will be overwritten after header defined, placeholder here
        }
      }

      function text(
        str: string, x: number, yPos: number,
        opts: { size?: number; color?: string; style?: "normal"|"bold"|"italic"; align?: "left"|"center"|"right" } = {}
      ) {
        pdf.setFontSize(opts.size ?? 10);
        pdf.setTextColor(opts.color ?? DARK);
        pdf.setFont("helvetica", opts.style ?? "normal");
        pdf.text(str, x, yPos, { align: opts.align ?? "left" });
      }

      function sectionHeader(title: string) {
        newPageIfNeeded(12);
        drawRect(pdf, MARGIN, y, INNER, 7, LIGHT_BG);
        pdf.setDrawColor("#e0ddd5");
        pdf.setLineWidth(0.1);
        pdf.rect(MARGIN, y, INNER, 7, "S");
        // Brand accent bar
        drawRect(pdf, MARGIN, y, 2, 7, BRAND);
        text(title.toUpperCase(), MARGIN + 5, y + 4.8,
          { size: 8, color: BRAND, style: "bold" });
        y += 10;
      }

      function field(label: string, value: string | null | undefined, x: number, colW: number) {
        const val = value?.trim() || "N/A";
        const lines = splitText(pdf, val, colW - 2);
        newPageIfNeeded(6 + lines.length * 4.5);
        text(label.toUpperCase(), x, y, { size: 7, color: MUTED });
        y += 4;
        lines.forEach((line) => {
          text(line, x, y, { size: 9.5, color: val === "N/A" ? "#aaaaaa" : DARK });
          y += 4.5;
        });
        y += 1;
      }

      function twoCol(
        l1: string, v1: string | null | undefined,
        l2: string, v2: string | null | undefined
      ) {
        const half = INNER / 2 - 3;
        const savedY = y;
        field(l1, v1, MARGIN, half);
        const leftEnd = y;
        y = savedY;
        field(l2, v2, MARGIN + INNER / 2 + 3, half);
        y = Math.max(leftEnd, y) + 1;
      }

      function divider() {
        pdf.setDrawColor("#e8e5dc");
        pdf.setLineWidth(0.2);
        pdf.line(MARGIN, y, W - MARGIN, y);
        y += 4;
      }

      // ── CONSTANTS ────────────────────────────────────────────────────────
      const isActive = member.membershipStatus === "ACTIVE";
      const genDate  = new Date().toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });
      // Header height (space reserved at top of every page)
      const HDR_H = 20;

      // ── Fetch logo as base64 (for PDF embedding) ─────────────────────────
      let logoB64 = "";
      let logoAspect = 3; // width/height ratio — updated from real image
      try {
        const logoRes = await fetch("/logo.png");
        if (logoRes.ok) {
          const blob = await logoRes.blob();
          const result = await new Promise<{ b64: string; aspect: number }>((res) => {
            const img = new Image();
            img.onload = () => {
              logoAspect = img.naturalWidth / img.naturalHeight;
              const canvas = document.createElement("canvas");
              const scale  = Math.min(1, 300 / img.naturalWidth);
              canvas.width  = Math.round(img.naturalWidth  * scale);
              canvas.height = Math.round(img.naturalHeight * scale);
              canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
              res({ b64: canvas.toDataURL("image/png"), aspect: logoAspect });
            };
            img.onerror = () => res({ b64: "", aspect: 3 });
            img.src = URL.createObjectURL(blob);
          });
          logoB64     = result.b64;
          logoAspect  = result.aspect;
        }
      } catch { /* logo not found — skip */ }

      // ── drawPageHeader — called on every page ────────────────────────────
      function drawPageHeader() {
        // Purple top bar
        drawRect(pdf, 0, 0, W, 3, BRAND);

        // Logo on left — natural aspect ratio, max height 10mm
        if (logoB64) {
          try {
            const lH = 10;                        // fixed height in mm
            const lW = Math.round(lH * logoAspect * 10) / 10; // width from real ratio
            pdf.addImage(logoB64, "PNG", MARGIN, 5, lW, lH);
          } catch { /* logo format issue — skip */ }
        } else {
          text("Let'z Pilates", MARGIN, 11, { size: 9, color: BRAND, style: "bold" });
        }

        // "FITNESS ASSESSMENT REPORT" label — right side
        text("FITNESS ASSESSMENT REPORT", W - MARGIN, 9,
          { size: 7, color: MUTED, align: "right" });

        // Thin separator line
        pdf.setDrawColor("#e0ddd5");
        pdf.setLineWidth(0.3);
        pdf.line(MARGIN, HDR_H, W - MARGIN, HDR_H);
      }

      // Override newPageIfNeeded so header is drawn on every new page
      const origNewPage = newPageIfNeeded;
      // Redefine to draw header after adding page
      function newPage() {
        pdf.addPage();
        y = HDR_H + 6;
        drawPageHeader();
      }

      // ── PAGE 1 — draw header + member info ───────────────────────────────
      drawPageHeader();
      y = HDR_H + 8;

      // Member name block
      text(member.name, MARGIN, y, { size: 20, color: DARK, style: "bold" });
      y += 7;
      if (member.instructor) {
        text(`Instructor: ${member.instructor.name}`, MARGIN, y,
          { size: 10, color: BRAND });
        y += 6;
      }

      // Right: date + status (fixed position, won't overlap name)
      text("Generated",  W - MARGIN, HDR_H + 10, { size: 7,  color: MUTED, align: "right" });
      text(genDate,      W - MARGIN, HDR_H + 15, { size: 10, color: DARK,  align: "right" });
      const pillW  = 20; const pillH = 5.5;
      const pillX  = W - MARGIN - pillW;
      const pillY2 = HDR_H + 18;
      drawRect(pdf, pillX, pillY2, pillW, pillH, isActive ? "#d4f0e3" : "#e8e5ec");
      pdf.setDrawColor(isActive ? "#1a7a4a" : "#7a7887");
      pdf.setLineWidth(0.1);
      pdf.roundedRect(pillX, pillY2, pillW, pillH, 2, 2, "S");
      text(isActive ? "Active" : "Inactive",
        pillX + pillW / 2, pillY2 + 3.8,
        { size: 7.5, color: isActive ? "#1a7a4a" : "#7a7887", align: "center", style: "bold" });

      y += 4;
      drawRect(pdf, MARGIN, y, INNER, 0.5, BRAND);
      y += 8;

      // ── MEMBER INFORMATION ────────────────────────────────────────────────
      if (sections.memberInfo) {
        sectionHeader("Member information");
        twoCol("Full name",   member.name,          "Phone",      member.phone);
        twoCol("Email",       member.email,          "Age",        member.age ? `${member.age} years old` : null);
        twoCol("Status",      isActive ? "Active" : "Inactive", "Instructor", member.instructor?.name);
        field("Joined", formatDate(member.joinedAt), MARGIN, INNER / 2 - 3);
        if (member.remarks) {
          field("Remarks", member.remarks, MARGIN, INNER);
        }
        divider();
      }

      // ── HEALTH & FITNESS HISTORY ──────────────────────────────────────────
      if (sections.healthHistory) {
        const hp = healthProfile;
        sectionHeader("Health & fitness history");
        twoCol(
          "Pilates experience",
          hp?.pilatesExperience ? EXPERIENCE_LABELS[hp.pilatesExperience] : null,
          "Fitness goal", hp?.fitnessGoal
        );
        if (hp?.physicalConsiderations)
          field("Physical considerations & injuries", hp.physicalConsiderations, MARGIN, INNER);
        twoCol("Current medications", hp?.currentMedications, "Current or past injuries", hp?.currentInjuries);
        if (hp?.pastSurgeries)
          field("Past or recent surgeries", hp.pastSurgeries, MARGIN, INNER);

        // Medical conditions
        const active = CONDITIONS.filter(
          (c) => !!(hp as Record<string, unknown>)?.[c.key]
        );
        if (active.length > 0) {
          newPageIfNeeded(14);
          text("MEDICAL CONDITIONS", MARGIN, y, { size: 7, color: MUTED });
          y += 4.5;
          // Draw pill badges
          let px = MARGIN;
          const pillH2 = 5; const gap = 2;
          active.forEach(({ label }) => {
            pdf.setFontSize(7.5);
            const lw = pdf.getTextWidth(label) + 6;
            if (px + lw > W - MARGIN) { px = MARGIN; y += pillH2 + gap; }
            drawRect(pdf, px, y - 3.5, lw, pillH2, LIGHT_BG);
            pdf.setDrawColor("#c4bdd8");
            pdf.setLineWidth(0.1);
            pdf.roundedRect(px, y - 3.5, lw, pillH2, 1.5, 1.5, "S");
            text(label, px + 3, y + 0.5, { size: 7.5, color: BRAND });
            px += lw + gap;
          });
          y += pillH2 + 4;
        }
        divider();
      }

      // ── INSTRUCTOR NOTES ──────────────────────────────────────────────────
      if (sections.instructorNotes) {
        const hp = healthProfile;
        sectionHeader("Instructor notes");
        field("Assessment summary", hp?.assessmentSummary, MARGIN, INNER);
        field("Training plan",      hp?.trainingPlan,      MARGIN, INNER);
        divider();
      }

      // ── PROGRESS IMAGES ────────────────────────────────────────────────────
      const hasImages = VIEWS.some(
        (v) => imageToggles[v] && (photos[v]?.length ?? 0) > 0
      );
      if (hasImages) {
        for (const view of VIEWS) {
          if (!imageToggles[view]) continue;
          const viewPhotos  = photos[view] ?? [];
          if (viewPhotos.length === 0) continue;

          const beforePhoto = viewPhotos.find((p) => p.id === beforeSel[view]);
          const afterPhoto  = viewPhotos.find((p) => p.id === afterSel[view]);
          if (!beforePhoto && !afterPhoto) continue;

          // Each image view gets its own page with header
          pdf.addPage();
          y = HDR_H + 6;
          drawPageHeader();

          // "BODY IMAGES" label + section line
          text("BODY IMAGES", MARGIN, y, { size: 7, color: MUTED });
          y += 5;
          pdf.setDrawColor(BRAND);
          pdf.setLineWidth(0.4);
          pdf.line(MARGIN, y, W - MARGIN, y);
          y += 7;

          // View title
          text(view.toUpperCase() + " VIEW", MARGIN, y,
            { size: 11, color: DARK, style: "bold" });
          y += 8;

          // Image dimensions — two columns
          const imgW = INNER / 2 - 3;
          const imgH = imgW * 1.4;

          for (const { photo, label } of [
            { photo: beforePhoto, label: "Before" },
            { photo: afterPhoto,  label: "After"  },
          ]) {
            const colX = label === "Before" ? MARGIN : MARGIN + INNER / 2 + 3;

            // Card background
            drawRect(pdf, colX, y, imgW, imgH + 14, "#faf9f7");
            pdf.setDrawColor("#e0ddd5");
            pdf.setLineWidth(0.2);
            pdf.roundedRect(colX, y, imgW, imgH + 14, 2, 2, "S");

            // Header bar
            drawRect(pdf, colX, y, imgW, 7, LIGHT_BG);
            text(label, colX + 3, y + 4.8,
              { size: 8, color: BRAND, style: "bold" });
            if (photo) {
              text(formatDate(photo.uploadedAt), colX + imgW - 2, y + 4.8,
                { size: 7, color: MUTED, align: "right" });
            }

            if (photo) {
              try {
                const b64 = await fetchImageAsBase64(photo.url);
                // Always JPEG — fetchImageAsBase64 already returns JPEG via canvas
                pdf.addImage(b64, "JPEG", colX + 1, y + 8, imgW - 2, imgH - 1);
              } catch {
                // Image fetch failed — draw placeholder
                drawRect(pdf, colX + 1, y + 8, imgW - 2, imgH - 1, "#f0edf8");
                text("Image unavailable", colX + imgW / 2, y + 8 + imgH / 2,
                  { size: 7.5, color: "#c4bdd8", align: "center" });
              }

              if (photo.remark) {
                const remarkLines = splitText(pdf, `"${photo.remark}"`, imgW - 4);
                const ry = y + 8 + imgH + 1;
                remarkLines.slice(0, 2).forEach((line, i) => {
                  text(line, colX + 2, ry + i * 3.5,
                    { size: 7, color: MUTED });
                });
              }
            } else {
              drawRect(pdf, colX + 1, y + 8, imgW - 2, imgH - 1, "#f5f3f0");
              text("No image selected", colX + imgW / 2, y + 8 + imgH / 2,
                { size: 7.5, color: "#c0bcc8", align: "center" });
            }
          }

          y += imgH + 18;
        }
      }

      // ── FOOTER on every page ─────────────────────────────────────────────
      const totalPages = (pdf as unknown as { internal: { pages: unknown[] } })
        .internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // Footer bar
        drawRect(pdf, 0, H - 8, W, 8, "#f5f3f0");
        pdf.setDrawColor("#e0ddd5");
        pdf.setLineWidth(0.2);
        pdf.line(0, H - 8, W, H - 8);
        text("Let'z Pilates", MARGIN, H - 3, { size: 7, color: MUTED });
        text(`Page ${i} of ${totalPages}`,
          W - MARGIN, H - 3, { size: 7, color: MUTED, align: "right" });
      }

      // ── Save ──────────────────────────────────────────────────────────────
      const date           = new Date().toISOString().split("T")[0];
      const memberSlug     = member.name.replace(/\s+/g, "_");
      const instructorSlug = (member.instructor?.name ?? "no_instructor").replace(/\s+/g, "_");
      pdf.save(`${memberSlug}_${instructorSlug}_${date}.pdf`);
      toast.success("Report downloaded successfully.");

    } catch (err) {
      console.error("[PDF] error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const inputCls = "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
  const hp = healthProfile;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#e0ddd5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede8]">
          <div>
            <div className="text-sm font-medium text-[#2d2b45]">Fitness report</div>
            <div className="text-xs text-[#a09aad] mt-0.5">Select sections to include in the PDF</div>
          </div>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-60 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            {generating ? "Generating…" : "Download PDF"}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Text sections */}
          <div>
            <div className="text-xs font-medium text-[#2d2b45] mb-3">Text sections</div>
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={sections.memberInfo}      onChange={(v) => setSections((s) => ({ ...s, memberInfo: v }))}      label="Member information" />
              <Checkbox checked={sections.healthHistory}   onChange={(v) => setSections((s) => ({ ...s, healthHistory: v }))}   label="Health & fitness history" />
              <Checkbox checked={sections.instructorNotes} onChange={(v) => setSections((s) => ({ ...s, instructorNotes: v }))} label="Instructor notes" />
            </div>
          </div>

          {/* Image sections */}
          <div>
            <div className="text-xs font-medium text-[#2d2b45] mb-3">Progress images</div>
            {photosLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#a09aad]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading photos…
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {VIEWS.map((view) => {
                  const viewPhotos  = photos[view] ?? [];
                  const toggled     = imageToggles[view];
                  const beforePhoto = viewPhotos.find((p) => p.id === beforeSel[view]);
                  const afterPhoto  = viewPhotos.find((p) => p.id === afterSel[view]);

                  return (
                    <div key={view} className="rounded-xl border border-[#e0ddd5] overflow-hidden">
                      <div className={cn("flex items-center gap-3 px-4 py-3", toggled && viewPhotos.length > 0 && "border-b border-[#f0ede8]")}>
                        <Checkbox
                          checked={toggled}
                          onChange={(v) => setImageToggles((s) => ({ ...s, [view]: v }))}
                          label={`${view.charAt(0).toUpperCase() + view.slice(1)} view`}
                        />
                        {viewPhotos.length === 0
                          ? <span className="text-xs text-[#c0bcc8] italic ml-1">No images uploaded</span>
                          : <span className="text-[10px] text-[#a09aad] ml-auto">{viewPhotos.length} photo{viewPhotos.length !== 1 ? "s" : ""}</span>
                        }
                      </div>

                      {toggled && viewPhotos.length > 0 && (
                        <div className="px-4 py-3 bg-[#faf9f7]">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Before", sel: beforeSel[view], setSel: (v: string) => setBeforeSel((s) => ({ ...s, [view]: v })), photo: beforePhoto },
                              { label: "After",  sel: afterSel[view],  setSel: (v: string) => setAfterSel((s)  => ({ ...s, [view]: v })), photo: afterPhoto  },
                            ].map(({ label, sel, setSel, photo }) => (
                              <div key={label}>
                                <div className="text-[10px] text-[#a09aad] mb-1.5 font-medium uppercase tracking-wide">{label}</div>
                                <select value={sel} onChange={(e) => setSel(e.target.value)} className={inputCls}>
                                  <option value="">— None —</option>
                                  {viewPhotos.map((p) => (
                                    <option key={p.id} value={p.id}>{formatDate(p.uploadedAt)}</option>
                                  ))}
                                </select>
                                {photo && (
                                  <div className="mt-2 rounded-lg overflow-hidden bg-[#f5f3f0] border border-[#e0ddd5]" style={{ aspectRatio: "4/3" }}>
                                    <img src={photo.url} alt={label} className="w-full h-full object-contain" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}