const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const AIService = {
    analyzeConversationScreenshots: async (imageFiles: File[]): Promise<{ summary: string; tone: string; keyPoints: string[] } | null> => {
        if (!OPENAI_API_KEY) {
            console.warn('OpenAI API Key not found.');
            return null;
        }

        if (imageFiles.length === 0) {
            return null;
        }

        try {
            // Convert images to base64
            const imagePromises = imageFiles.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            const base64Images = await Promise.all(imagePromises);

            // Build messages with all images
            const imageMessages = base64Images.map(base64 => ({
                type: "image_url" as const,
                image_url: {
                    url: base64,
                    detail: "high" as const
                }
            }));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // GPT-4 Vision
                    messages: [
                        {
                            role: 'system',
                            content: `You are analyzing conversation screenshots for a co-parenting documentation app.

Your task:
1. Read all text from the screenshots
2. Summarize the key points of the conversation
3. Identify the overall tone (Cooperative, Neutral, Hostile, Passive-Aggressive, Concerned, etc.)
4. Extract any important agreements, conflicts, or action items

Return your analysis in this exact JSON format:
{
  "summary": "2-3 sentence summary of the conversation",
  "tone": "Single word or short phrase describing tone",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}`
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: "text",
                                    text: "Please analyze these conversation screenshots and provide a summary, tone analysis, and key points."
                                },
                                ...imageMessages
                            ]
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) return null;

            // Parse JSON response
            try {
                const result = JSON.parse(content);
                return result;
            } catch {
                // If not JSON, return as simple summary
                return {
                    summary: content,
                    tone: 'Neutral',
                    keyPoints: []
                };
            }
        } catch (error) {
            console.error('AI Screenshot Analysis failed:', error);
            return null;
        }
    },

    summarizeText: async (text: string): Promise<string | null> => {
        if (!OPENAI_API_KEY) {
            console.warn('OpenAI API Key not found.');
            return null;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant for a co-parenting tracker app. Summarize the following conversation log or notes concisely, focusing on key agreements, dates, or conflicts.' },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (error) {
            console.error('AI Summarization failed:', error);
            return null;
        }
    },

    analyzeTone: async (text: string): Promise<string | null> => {
        if (!OPENAI_API_KEY) return null;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'Analyze the tone of this message. Return a single word or short phrase (e.g., "Hostile", "Cooperative", "Neutral", "Passive-Aggressive").' },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 20
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (error) {
            console.error('AI Tone Analysis failed:', error);
            return null;
        }
    }
};
