"use client";

import { useCallback, useState, type ComponentType } from "react";
import EasyCrop, { type Area } from "react-easy-crop";

// Class component types from react-easy-crop fail JSX checks on Vercel's TypeScript.
const Cropper = EasyCrop as unknown as ComponentType<{
  image?: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect?: number;
  cropShape?: "rect" | "round";
  showGrid?: boolean;
  onCropChange: (location: { x: number; y: number }) => void;
  onZoomChange?: (zoom: number) => void;
  onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
}>;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function getCroppedSquareBlob(
  imageSrc: string,
  crop: Area,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image.")));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.round(Math.min(crop.width, crop.height));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop image.");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not create cropped image."));
        else resolve(blob);
      },
      "image/png",
      0.95,
    );
  });
}

export function LogoCropDialog({
  open,
  imageSrc,
  fileName,
  onOpenChange,
  onCropped,
}: {
  open: boolean;
  imageSrc: string;
  fileName?: string;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function applyCrop() {
    if (!croppedArea) return;
    setBusy(true);
    setError("");
    try {
      const blob = await getCroppedSquareBlob(imageSrc, croppedArea);
      const base = (fileName || "logo").replace(/\.[^.]+$/, "") || "logo";
      onCropped(new File([blob], `${base}-square.png`, { type: "image/png" }));
      onOpenChange(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop logo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="logo-crop-dialog sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Crop logo</DialogTitle>
          <DialogDescription>
            Adjust the square (1:1) crop, then apply.
          </DialogDescription>
        </DialogHeader>
        <div className="logo-crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="logo-crop-zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            className="button button-outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={applyCrop}
            disabled={busy || !croppedArea}
          >
            {busy ? "Cropping…" : "Apply crop"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
