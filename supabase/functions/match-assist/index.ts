// Optional AI assist for the "Match me" feature.
//
// The matcher works fully in the browser without this function. When it is
// deployed and VITE_MATCH_ASSIST_URL points at it, the student's own words
// are structured by Google's Gemini free tier instead of the local keyword
// rules.
//
// Deploy (free):
//   supabase functions deploy match-assist
//   supabase secrets set GEMINI_API_KEY=<free key from https://aistudio.google.com/apikey>
//
// Cost: Gemini's free tier covers this comfortably; no paid services.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM = `You extract scholarship-search criteria from a student's short self-description.
Return ONLY compact JSON with these keys:
- "degrees": subset of ["Undergraduate","Postgraduate","PhD / Research"]
- "fields": subset of ["Engineering","Business","Medicine","Law","Science","Arts","Sport"]
- "countries": array of country names in English, e.g. ["United Kingdom"]
- "fullyFunded": boolean, true if they want full funding / full tuition / 100%.
Omit keys you cannot infer. No prose, no markdown.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const respond = (body: string, status = 200, json = false) =>
  new Response(body, {
    status,
    headers: { ...CORS, ...(json ? { "Content-Type": "application/json" } : {}) },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return respond("ok");
  if (req.method !== "POST") return respond("method not allowed", 405);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return respond("not configured", 503);

  let text = "";
  try {
    text = String((await req.json()).text ?? "").slice(0, 1000);
  } catch {
    return respond("bad request", 400);
  }
  if (!text.trim()) return respond("bad request", 400);

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\nStudent: ${text}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
  });
  if (!res.ok) return respond("upstream error", 502);

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    return respond(JSON.stringify(JSON.parse(raw)), 200, true);
  } catch {
    return respond("{}", 200, true);
  }
});
