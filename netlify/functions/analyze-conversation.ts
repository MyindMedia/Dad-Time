import type { Handler } from '@netlify/functions'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export const handler: Handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: 'OPENAI_API_KEY not configured' }
    }

    const req = JSON.parse(event.body || '{}')
    const base64Image: string | undefined = req.image_data
    if (!base64Image) {
      return { statusCode: 400, body: 'Missing image_data' }
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You analyze conversation screenshots and return JSON with summary, tone (Cooperative/Hostile/Neutral), key_points, confidence_score (0-1). Be concise.'
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

    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!resp.ok) {
      const text = await resp.text()
      return { statusCode: resp.status, body: text }
    }
    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: content || '{}'
    }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Server error' }
  }
}
