import { GoogleGenerativeAI } from '@google/generative-ai';
import { withKeyRotation } from './ai-key-manager';

// ─── System Prompt (Bahasa Indonesia) ────────────────────────────────────────
const SYSTEM_PROMPT = `
Kamu adalah Asisten AI untuk sistem SantriDanaKu — platform manajemen anggaran untuk pondok pesantren.
Kamu membantu admin, approver, dan pengaju dalam:
- Menganalisis kelayakan ajuan anggaran
- Memberikan rekomendasi yang bijak dan islami
- Menjawab pertanyaan tentang sistem manajemen keuangan pesantren
- Membuat rangkuman dokumen dan catatan

Selalu gunakan Bahasa Indonesia yang sopan, profesional, dan sesuai konteks pesantren.
Berikan jawaban yang ringkas, jelas, dan actionable.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// analyzeAjuan()
// Deep AI analysis of a budget request with structured recommendations.
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeAjuan(ajuanData: {
  kode: string;
  judul: string;
  instansi: string;
  rencana_penggunaan: string;
  total: number;
  items: Array<{ nama_item: string; qty: number; satuan?: string; harga: number; subtotal: number }>;
  history?: Array<{ aksi: string; catatan?: string }>;
}): Promise<{
  analisis: string;
  poin_positif: string[];
  poin_perhatian: string[];
  rekomendasi: 'SETUJUI' | 'TINJAU_ULANG' | 'TOLAK';
  alasan_rekomendasi: string;
  skor_kelayakan: number; // 0-100
}> {
  const itemsText = ajuanData.items
    .map((i) => `  - ${i.nama_item}: ${i.qty} ${i.satuan ?? 'unit'} × Rp${i.harga.toLocaleString('id-ID')} = Rp${i.subtotal.toLocaleString('id-ID')}`)
    .join('\n');

  const prompt = `
Analisis ajuan anggaran berikut secara mendalam dan berikan penilaian profesional:

KODE AJUAN: ${ajuanData.kode}
JUDUL: ${ajuanData.judul}
INSTANSI: ${ajuanData.instansi}
RENCANA PENGGUNAAN: ${ajuanData.rencana_penggunaan}
TOTAL ANGGARAN: Rp${ajuanData.total.toLocaleString('id-ID')}

RINCIAN ITEM:
${itemsText}

Berikan analisis dalam format JSON berikut (tanpa markdown, pure JSON):
{
  "analisis": "Analisis narasi lengkap 2-3 paragraf",
  "poin_positif": ["poin 1", "poin 2"],
  "poin_perhatian": ["poin 1", "poin 2"],
  "rekomendasi": "SETUJUI" | "TINJAU_ULANG" | "TOLAK",
  "alasan_rekomendasi": "Alasan singkat 1-2 kalimat",
  "skor_kelayakan": 0-100
}
`.trim();

  const response = await withKeyRotation(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    return result.response.text();
  });

  try {
    return JSON.parse(response);
  } catch {
    // Fallback if JSON parsing fails
    return {
      analisis: response,
      poin_positif: [],
      poin_perhatian: [],
      rekomendasi: 'TINJAU_ULANG',
      alasan_rekomendasi: 'Tidak dapat mem-parsing respons AI secara otomatis.',
      skor_kelayakan: 50,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// summarizeText()
// Summarize any text (approval notes, documents, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export async function summarizeText(text: string): Promise<string> {
  const prompt = `Buat rangkuman singkat dan padat dari teks berikut dalam Bahasa Indonesia (maks 3 paragraf):\n\n${text}`;

  return withKeyRotation(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    });

    return result.response.text();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// chat()
// Multi-turn conversation with the SantriDanaKu AI assistant.
// ─────────────────────────────────────────────────────────────────────────────
export async function chat(
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [],
): Promise<string> {
  return withKeyRotation(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      systemInstruction: SYSTEM_PROMPT,
    });

    const chatSession = model.startChat({
      history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  });
}
