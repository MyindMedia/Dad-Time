import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisRequest {
  text: string
  screenshot_url?: string
  context: string
}

interface ToneAnalysis {
  overall_tone: string
  emotional_indicators: string[]
  concerning_language: string[]
  recommended_response: string
  confidence_score: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, screenshot_url, context }: AnalysisRequest = req.body

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const systemPrompt = `You are an AI assistant specialized in analyzing communication for child custody situations. 
    Analyze the following conversation and provide:
    1. Overall tone (positive, negative, neutral, concerning, hostile, friendly, professional)
    2. Emotional indicators (list of emotions detected)
    3. Any concerning language patterns that might be problematic in custody contexts
    4. Recommended response strategy
    5. Confidence score (0.0 to 1.0)

    Focus on identifying:
    - Hostile or aggressive language
    - Manipulative communication
    - Threats or intimidation
    - Inappropriate emotional appeals
    - Professional vs. unprofessional tone
    - Co-parenting cooperation indicators

    Context: ${context}

    Respond with a JSON object only, no additional text.`

    const userPrompt = `Analyze this conversation:\n\n${text}`

    if (screenshot_url) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: screenshot_url,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      try {
        const analysis: ToneAnalysis = JSON.parse(response)
        return res.status(200).json({ analysis })
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response)
        throw new Error('Invalid response format from OpenAI')
      }
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      try {
        const analysis: ToneAnalysis = JSON.parse(response)
        return res.status(200).json({ analysis })
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response)
        throw new Error('Invalid response format from OpenAI')
      }
    }
  } catch (error: any) {
    console.error('Conversation analysis error:', error)
    
    // Fallback analysis for demo purposes
    const fallbackAnalysis: ToneAnalysis = {
      overall_tone: 'neutral',
      emotional_indicators: ['professional'],
      concerning_language: [],
      recommended_response: 'Continue maintaining professional communication.',
      confidence_score: 0.7
    }

    return res.status(200).json({ 
      analysis: fallbackAnalysis,
      warning: 'Using fallback analysis due to API error'
    })
  }
}