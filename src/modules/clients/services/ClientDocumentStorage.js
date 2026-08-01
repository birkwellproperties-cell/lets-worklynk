import {
  isSupabaseConfigured,
  supabase,
} from "../../../services/supabase";

export const CLIENT_DOCUMENT_BUCKET =
  "client-documents";

export const CLIENT_DOCUMENT_MAX_FILE_SIZE =
  25 * 1024 * 1024;

export const CLIENT_DOCUMENT_ALLOWED_MIME_TYPES =
  new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ]);

function requireSupabase() {
  if (
    !isSupabaseConfigured ||
    !supabase
  ) {
    throw new Error(
      "Supabase is not configured.",
    );
  }

  return supabase;
}

function requireIdentifier(
  value,
  label,
) {
  if (!value) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value;
}

function sanitizeFileName(value) {
  const source =
    String(value ?? "")
      .trim();

  const extensionIndex =
    source.lastIndexOf(".");

  const extension =
    extensionIndex >= 0
      ? source
          .slice(extensionIndex)
          .toLowerCase()
      : "";

  const baseName =
    extensionIndex >= 0
      ? source.slice(
          0,
          extensionIndex,
        )
      : source;

  const safeBase =
    baseName
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        120,
      ) ||
    "document";

  return `${safeBase}${extension}`;
}

function createStoredFileName(
  originalFileName,
) {
  return [
    Date.now(),
    crypto.randomUUID(),
    sanitizeFileName(
      originalFileName,
    ),
  ].join("-");
}

export class ClientDocumentStorage {
  validateFile(file) {
    if (!file) {
      throw new Error(
        "A document file is required.",
      );
    }

    if (
      !CLIENT_DOCUMENT_ALLOWED_MIME_TYPES
        .has(file.type)
    ) {
      throw new Error(
        "This file type is not supported.",
      );
    }

    if (
      file.size <= 0
    ) {
      throw new Error(
        "The selected file is empty.",
      );
    }

    if (
      file.size >
      CLIENT_DOCUMENT_MAX_FILE_SIZE
    ) {
      throw new Error(
        "The file cannot exceed 25 MB.",
      );
    }

    return file;
  }

  buildStoragePath({
    relationshipId,
    documentId,
    versionNumber,
    fileName,
  }) {
    return [
      requireIdentifier(
        relationshipId,
        "Client relationship ID",
      ),

      requireIdentifier(
        documentId,
        "Client document ID",
      ),

      `v${versionNumber}`,

      fileName,
    ].join("/");
  }

  async uploadVersion({
    relationshipId,
    documentId,
    versionNumber,
    file,
  }) {
    const client =
      requireSupabase();

    this.validateFile(
      file,
    );

    const storedFileName =
      createStoredFileName(
        file.name,
      );

    const storagePath =
      this.buildStoragePath({
        relationshipId,
        documentId,
        versionNumber,
        fileName:
          storedFileName,
      });

    const {
      data,
      error,
    } = await client.storage
      .from(
        CLIENT_DOCUMENT_BUCKET,
      )
      .upload(
        storagePath,
        file,
        {
          cacheControl:
            "3600",

          contentType:
            file.type,

          upsert:
            false,
        },
      );

    if (error) {
      throw error;
    }

    return {
      bucket:
        CLIENT_DOCUMENT_BUCKET,

      path:
        data.path,

      originalFileName:
        file.name,

      storedFileName,

      mimeType:
        file.type,

      fileSizeBytes:
        file.size,
    };
  }

  async removeObject(
    storagePath,
  ) {
    const client =
      requireSupabase();

    const {
      error,
    } = await client.storage
      .from(
        CLIENT_DOCUMENT_BUCKET,
      )
      .remove([
        storagePath,
      ]);

    if (error) {
      throw error;
    }
  }

  async createSignedUrl(
    storagePath,
    expiresInSeconds = 300,
  ) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.storage
      .from(
        CLIENT_DOCUMENT_BUCKET,
      )
      .createSignedUrl(
        requireIdentifier(
          storagePath,
          "Storage path",
        ),
        expiresInSeconds,
      );

    if (error) {
      throw error;
    }

    return data?.signedUrl ??
      null;
  }

  async download(
    storagePath,
  ) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.storage
      .from(
        CLIENT_DOCUMENT_BUCKET,
      )
      .download(
        requireIdentifier(
          storagePath,
          "Storage path",
        ),
      );

    if (error) {
      throw error;
    }

    return data;
  }
}

export function createClientDocumentStorage() {
  return new ClientDocumentStorage();
}

export const clientDocumentStorage =
  createClientDocumentStorage();
