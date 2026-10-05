export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { textToCheck } = req.body;
    
    // The key is securely pulled from the server's environment variables
    const API_KEY = process.env.GEMINI_API_KEY; 
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + API_KEY;

    const promptText = `Analyze this text for grammar, punctuation, and spelling errors. 
    Output ONLY a JSON object containing a 'matches' array. 
    Each item in the array must have:
    - "badPhrase": the exact incorrect word or phrase from the original text
    - "replacements": an array of up to 3 corrected strings
    - "message": a short explanation of why it is wrong
    If there are no errors, return {"matches": []}.
    Text to analyze: "${textToCheck}"`;

    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            responseMimeType: "application/json" 
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Google API Error: ${response.status}` });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}