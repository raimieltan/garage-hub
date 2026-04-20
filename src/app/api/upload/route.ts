import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { saveMultipleFiles, MAX_FILE_SIZE, ALLOWED_TYPES } from "@/lib/upload";

export async function GET() {
  return Response.json({
    maxFileSizeBytes: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    allowedTypes: ALLOWED_TYPES,
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const formData = await request.formData();
    const entries = formData.getAll("files");

    if (entries.length === 0) {
      return Response.json({ error: "No files provided. Send files under the field name \"files\"." }, { status: 400 });
    }

    // Ensure every entry is a File (not a plain string)
    const files: File[] = [];
    for (const entry of entries) {
      if (!(entry instanceof File)) {
        return Response.json({ error: "Each \"files\" entry must be a file, not a string." }, { status: 400 });
      }
      files.push(entry);
    }

    let urls: string[];
    try {
      urls = await saveMultipleFiles(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : "File processing failed";

      // Distinguish between a size violation (413) and a type violation (400)
      if (message.toLowerCase().includes("too large")) {
        return Response.json({ error: message }, { status: 413 });
      }
      return Response.json({ error: message }, { status: 400 });
    }

    return Response.json({ urls }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/upload]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
