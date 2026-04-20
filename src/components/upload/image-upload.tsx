"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const token = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 5,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxFiles} images allowed`);
        return;
      }

      const filesToUpload = acceptedFiles.slice(0, remaining);

      // Validate file sizes
      const oversized = filesToUpload.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        toast.error(
          `${oversized.length} file(s) exceed the 5MB limit and were skipped`
        );
        const valid = filesToUpload.filter((f) => f.size <= MAX_FILE_SIZE);
        if (valid.length === 0) return;

        setIsUploading(true);
        try {
          const urls = await uploadFiles(valid);
          onChange([...value, ...urls]);
          toast.success(`${urls.length} image(s) uploaded`);
        } catch {
          toast.error("Failed to upload images. Please try again.");
        } finally {
          setIsUploading(false);
        }
        return;
      }

      setIsUploading(true);
      try {
        const urls = await uploadFiles(filesToUpload);
        onChange([...value, ...urls]);
        toast.success(`${urls.length} image(s) uploaded`);
      } catch {
        toast.error("Failed to upload images. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: maxFiles - value.length,
    disabled: isUploading || value.length >= maxFiles,
    onDropRejected: (rejections) => {
      const errors = rejections
        .flatMap((r) => r.errors)
        .map((e) => e.message)
        .filter((msg, i, arr) => arr.indexOf(msg) === i);
      toast.error(errors[0] ?? "Some files were rejected");
    },
  });

  function handleRemove(index: number) {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  }

  const isAtLimit = value.length >= maxFiles;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Dropzone */}
      {!isAtLimit && (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/30",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <ImageIcon className="size-8 text-primary" />
              ) : (
                <Upload className="size-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragActive
                    ? "Drop images here"
                    : "Drop images here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, GIF up to 5MB each
                  {maxFiles > 1 && ` · Up to ${maxFiles} images`}
                </p>
              </div>
              {value.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {value.length} / {maxFiles} uploaded
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}

          {/* Add more slot shown when under limit */}
          {isAtLimit && (
            <p className="col-span-full text-center text-xs text-muted-foreground py-1">
              Maximum {maxFiles} images reached
            </p>
          )}
        </div>
      )}
    </div>
  );
}
