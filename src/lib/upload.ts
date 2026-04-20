import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Map MIME type to a safe extension — never derive extension from the filename
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export { MAX_FILE_SIZE, ALLOWED_TYPES };

export async function saveUploadedFile(file: File): Promise<string> {
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename using the MIME-derived extension, not the client-supplied filename
  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  await writeFile(filePath, buffer);

  // Return the public URL path
  return `/uploads/${uniqueName}`;
}

export async function saveMultipleFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(saveUploadedFile));
}
