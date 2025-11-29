const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const BACKEND_URL = "http://localhost:8000"; // Codespaces usually forwards this automatically

// --- BACKEND: CLUSTERING ---
export async function uploadExcelForClustering(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${BACKEND_URL}/analyze-segments`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error("Backend connection failed");
        return await response.json();
    } catch (e) {
        console.error("Clustering Error:", e);
        return { success: false, error: e.message };
    }
}

// --- UTILS: WEB SCRAPING ---
export async function scrapeWebPage(url) {
  const scrapeUrl = `https://r.jina.ai/${url}`;
  try {
    const response = await fetch(scrapeUrl);
    if (!response.ok) throw new Error("Failed to read website");
    const text = await response.text();
    if (!text || text.length < 50) return null;
    return text;
  } catch (e) {
    console.error("Scraping failed:", e);
    return null;
  }
}

// --- GEMINI & IMAGEN ---
export async function callGemini(prompt, systemInstruction = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return { success: false, error: `API Error: ${response.status}` };
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, error: "Empty response." };

    let cleanText = text.replace(/^```json\s*/, "").replace(/^```/, "").replace(/```$/, "");
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) cleanText = cleanText.substring(startIndex, endIndex + 1);

    return { success: true, data: JSON.parse(cleanText) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function callImagen(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
  const payload = { instances: [{ prompt }], parameters: { sampleCount: 1 } };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.predictions?.[0]?.bytesBase64Encoded) return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    return null;
  } catch (e) { return null; }
}

export async function callGeminiText(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) { return null; }
}
