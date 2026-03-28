// utils/export/fontLoader.ts

import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const CHINESE_FONT_NAME = 'NotoSansTC';

/**
 * Use a reliable CDN for NotoSansTC TTF font.
 * Using raw.githubusercontent.com with a specific tag/version.
 */
const CDN_FONT_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSansTC/NotoSansTC-Regular.ttf';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level cache (survives across multiple PDF generations in one session)
// ─────────────────────────────────────────────────────────────────────────────

let fontBase64Cache: string | null = null;
let fontLoadFailed = false; // stop retrying after a permanent failure

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads NotoSansTC into the given jsPDF instance and activates it.
 *
 * @returns `true` – font loaded & active, use CHINESE_FONT_NAME
 * @returns `false` – font unavailable, fall back to 'helvetica'
 */
export async function loadChineseFont(doc: jsPDF): Promise<boolean> {
  // Don't retry after a permanent failure
  if (fontLoadFailed) return false;

  try {
    // If this jsPDF instance already has the font registered, just activate it
    const registeredFonts = doc.getFontList() as Record<string, string[]>;
    if (registeredFonts[CHINESE_FONT_NAME]) {
      doc.setFont(CHINESE_FONT_NAME, 'normal');
      return true;
    }

    // Fetch / retrieve from cache
    const base64Font = await fetchFontAsBase64();
    if (!base64Font) {
      fontLoadFailed = true;
      return false;
    }

    // Inject into jsPDF VFS, register, and activate
    doc.addFileToVFS('NotoSansTC-Regular.ttf', base64Font);
    doc.addFont('NotoSansTC-Regular.ttf', CHINESE_FONT_NAME, 'normal');
    doc.setFont(CHINESE_FONT_NAME, 'normal');

    console.info('[fontLoader] NotoSansTC loaded successfully.');
    return true;
  } catch (err) {
    console.error('[fontLoader] Unexpected error:', err);
    fontLoadFailed = true;
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the base64-encoded font string.
 * Tries CDN, then gives up.
 * Result is cached at module level.
 */
async function fetchFontAsBase64(): Promise<string | null> {
  if (fontBase64Cache) return fontBase64Cache;

  // ── Try CDN ────────────────────────────────────────────────────────────────
  try {
    const buffer = await fetchBuffer(CDN_FONT_URL);
    fontBase64Cache = arrayBufferToBase64(buffer);
    return fontBase64Cache;
  } catch (err) {
    console.error('[fontLoader] CDN font fetch failed:', err);
    return null;
  }
}

/**
 * Fetches a URL and returns its body as an ArrayBuffer.
 * Throws on non-2xx status.
 */
async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[fontLoader] HTTP ${response.status} ${response.statusText} — ${url}`);
  }
  return response.arrayBuffer();
}

/**
 * Converts an ArrayBuffer to a base64 string safely.
 *
 * ⚠️ The naive approach — btoa(String.fromCharCode(...all bytes)) — blows the 
 * JS call stack for files larger than ~5 MB. Processing in 8 KB chunks 
 * keeps each String.fromCharCode call well within safe limits.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 8192;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }

  return btoa(binary);
}