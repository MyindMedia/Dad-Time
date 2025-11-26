const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string

type AnalysisResult = {
  summary: string
  tone: 'Cooperative' | 'Hostile' | 'Neutral'
  key_points: string[]
  confidence_score: number
}

export async function analyzeConversationScreenshot(base64Image: string): Promise<AnalysisResult> {
  if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key')

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an assistant that analyzes conversation screenshots and returns JSON with summary, tone (Cooperative/Hostile/Neutral), key_points, confidence_score (0-1). Be concise.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this conversation screenshot and output strict JSON.' },
          { type: 'input_image', image_url: `data:image/png;base64,${base64Image}` }
        ]
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  const parsed = JSON.parse(content)
  return parsed as AnalysisResult
}
