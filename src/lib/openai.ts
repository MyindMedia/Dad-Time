type AnalysisResult = {
  summary: string
  tone: 'Cooperative' | 'Hostile' | 'Neutral'
  key_points: string[]
  confidence_score: number
}

export async function analyzeConversationScreenshot(base64Image: string): Promise<AnalysisResult> {
  const res = await fetch('/.netlify/functions/analyze-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_data: base64Image })
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const parsed = await res.json()
  return parsed as AnalysisResult
}
