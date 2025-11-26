import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return { statusCode: 500, body: 'OPENAI_API_KEY not configured' }
    const { draft, summary, tone, key_points } = JSON.parse(event.body || '{}')
    if (!draft) return { statusCode: 400, body: 'Missing draft' }

    const prompt = `You are a negotiation coach using principles popularized by Chris Voss.
Context summary: ${summary || ''}
Tone detected: ${tone || ''}
Key points: ${(key_points || []).join('; ')}

Rewrite the user's draft response using these tools appropriately and ethically for co‑parenting:
- Labels ("It seems…", "It sounds like…")
- Mirrors (repeat key words)
- Calibrated questions ("How would it look if…?", "What’s the best way to…?")
- Accusations audit (if needed)
- Tactical empathy and summarizing ("What I’m hearing is…")

Return strict JSON with fields:
{
  "primary": string,
  "alternatives": string[],
  "calibrated_questions": string[],
  "labels": string[],
  "mirrors": string[],
  "summary_statement": string
}`

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Provide responses suitable for custody/parenting communication. Be respectful, specific, and keep messages concise.' },
        { role: 'user', content: [ { type: 'text', text: `${prompt}\n\nUser draft:\n${draft}` } ] }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    })
    if (!resp.ok) return { statusCode: resp.status, body: await resp.text() }
    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: content }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Server error' }
  }
}
