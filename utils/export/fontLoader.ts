// Source: Noto Sans SC (Simplified Chinese) - subset for common chars
// This is a placeholder as the full Base64 string is too large to include directly in a single tool call comfortably without external file download. 
// However, for the purpose of this environment, we will use a common solution: 
// 1. Use a standard font that might be available or 
// 2. Add a custom font. 
// Since we can't easily download files, I'll add a utility to load a standard font if available or fallback. 
// BUT, for Chinese in jsPDF, we MUST register a font. 
// I will use a known lightweight font string or a strategy to fetch it.
// Given the environment constraints, I will add a method to `utils/export/pdfExport.ts` to use a font if provided, 
// but primarily address the UI issues first. To fix the Chinese character issue properly in a browser-based environment without external fetch, 
// we typically need to bundle the font. I will create a new file `utils/export/fonts/simhei.ts` with a truncated/subset version if possible, 
// or simulated solution.

// ACTUAL SOLUTION FOR THIS ENV:
// I will assume for now we can't simply "download" a 5MB font file. 
// I will create a helper that attempts to use a font that supports Chinese if available, or explain the limitation. 
// However, to "fix" it as requested, I must provide a way. 
// I will add a dynamic import or fetch for a font file from a CDN if permitted, or use a base64 string for a very minimal subset? 
// No, the best robust way is to fetch from a CDN like Google Fonts or similar, turn to arraybuffer, and add.

// Strategy: Modify `utils/export/pdfExport.ts` to fetch a font file (Noto Sans SC) from a standard CDN URL, 
// add it to VFS, and register it. This is surprisingly common in FE apps.

export const NOTO_SANS_SC_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/files/noto-sans-sc-latin-400-normal.woff'; 
// Actually woff might not work directly with jspdf addFont depending on version. ttf is safer.
// Let's use a reliable TTF link for a Unicode font.
// https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Simplified/NotoSansCJKsc-Regular.otf 
// (OTF works in newer jsPDF)

// Better yet, I will create a font loader utility.

import { jsPDF } from 'jspdf';

export async function loadChineseFont(doc: jsPDF) {
  try {
    // Using a CDN for Noto Sans SC (Simplified Chinese)
    const response = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC-Regular.ttf');
    if (!response.ok) throw new Error('Failed to load font');
    
    const fontBlob = await response.blob();
    const reader = new FileReader();

    return new Promise<void>((resolve) => {
      reader.onloadend = () => {
        const fontBase64 = reader.result?.toString().split(',')[1];
        if (fontBase64) {
          doc.addFileToVFS('NotoSansSC-Regular.ttf', fontBase64);
          doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
          doc.setFont('NotoSansSC');
          resolve();
        }
      };
      reader.readAsDataURL(fontBlob);
    });
  } catch (error) {
    console.error('Error loading Chinese font:', error);
    // Fallback or notify user
  }
}
