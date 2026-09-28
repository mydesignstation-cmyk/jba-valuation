/**
 * Client-side download helpers. Browser-only (uses Blob / DOM APIs).
 *
 * Kept free of any server import so it is safe to use from components.
 */

/** Decode a base64 string into a Uint8Array (browser-safe, no Buffer). */
function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Trigger a browser download of base64-encoded bytes as a file with the given
 * content type. Creates a temporary object URL and an anchor, clicks it, then
 * cleans up. No data is persisted anywhere.
 */
export function downloadBase64File(
  base64: string,
  filename: string,
  contentType = "application/octet-stream",
): void {
  const bytes = base64ToBytes(base64);
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke on the next tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
