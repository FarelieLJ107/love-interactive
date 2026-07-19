import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Love Letter Generator API
app.post("/api/generate-letter", async (req, res) => {
  try {
    const { partnerName, senderName, milestone, style } = req.body;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server side." });
    }
    
    const prompt = `Tulis sebuah surat cinta yang sangat romantis, unik, personal, dan mendalam untuk ${partnerName || 'sayang'} dari ${senderName || 'aku'}. 
    Momen/milestone hubungan saat ini: ${milestone || 'Hari biasa yang penuh rindu'}.
    Gaya bahasa: ${style || 'Sangat Romantis, Menyentuh Hati, Sedikit Puisi'}.
    Surat cinta harus ditulis dalam Bahasa Indonesia yang indah, penuh ketulusan, menyentuh jiwa, dan menyertakan emoji cinta yang manis. Jangan terlalu kaku, buat seolah ditulis langsung dari lubuk hati yang terdalam. Jangan buat teks terlalu panjang, sekitar 3-4 paragraf yang sangat bermakna.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    res.json({ letter: response.text });
  } catch (error: any) {
    console.error("Error generating love letter:", error);
    res.status(500).json({ error: error.message || "Failed to generate love letter." });
  }
});

// Love Quiz Generator API
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { partnerName } = req.body;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server side." });
    }

    const nameToUse = partnerName || "pasanganmu";
    const prompt = `Hasilkan 5 pertanyaan kuis interaktif yang seru, lucu, romantis, dan penuh kasih sayang tentang seberapa kenal seseorang dengan pasangannya (${nameToUse}). 
    Format respons harus berupa JSON array murni, tanpa markdown formatting (seperti \`\`\`json ... \`\`\`), yang memiliki struktur persis seperti berikut:
    [
      {
        "question": "Jika ${nameToUse} memenangkan lotre, apa hal pertama yang mungkin dia beli untuk merayakannya?",
        "options": [
          "A) Liburan romantis berdua ke destinasi impian",
          "B) Gadget atau barang koleksi hobi pribadinya",
          "C) Membeli makan malam termewah bersama seluruh keluarga",
          "D) Menabung semuanya untuk masa depan bersama kalian"
        ],
        "answerIndex": 0,
        "explanation": "Sebuah liburan romantis berdua adalah cara terindah untuk merayakan kebahagiaan bersama! 🥰"
      }
    ]
    Pastikan pertanyaan dan opsi ditulis dalam Bahasa Indonesia yang menggemaskan, hangat, dan interaktif. Hasilkan tepat 5 pertanyaan yang bervariasi (tentang kebiasaan, kesukaan, impian, skenario lucu, atau love language).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              answerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "answerIndex", "explanation"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "[]");
    res.json({ quiz: parsedData });
  } catch (error: any) {
    console.error("Error generating love quiz:", error);
    res.status(500).json({ error: error.message || "Failed to generate love quiz." });
  }
});

// Vite middleware for development & production asset handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
