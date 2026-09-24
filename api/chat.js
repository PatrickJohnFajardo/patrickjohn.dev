import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Using gemini-3.6-pro as a fallback for high demand
    const response = await ai.models.generateContent({
        model: 'gemini-3.6-pro',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `You are Patrick John, a Senior Software Engineer and creative developer. 
You are currently chatting with a recruiter or client visiting your portfolio website.
Keep your answers very brief (1-3 sentences max), professional but slightly playful, and focused on frontend development (Vite, GSAP, Three.js, React).
If they ask for contact info, give them patrick80361@gmail.com or mention LinkedIn.
The user just said: "${message}"`
                    }
                ]
            }
        ]
    });

    const replyText = response.text || "I'm a bit tied up right now, but feel free to email me at patrick80361@gmail.com!";
    
    res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: error.message || error.toString() });
  }
}
