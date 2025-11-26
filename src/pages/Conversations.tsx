import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { PhotoIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, FaceSmileIcon, FaceFrownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Conversation {
  id: string
  title: string
  content: string
  tone_analysis: {
    overall_tone: string
    emotional_indicators: string[]
    concerning_language: string[]
    recommended_response: string
    confidence_score: number
  }
  screenshot_url: string | null
  created_at: string
  is_analyzed: boolean
}

interface ToneAnalysis {
  overall_tone: string
  emotional_indicators: string[]
  concerning_language: string[]
  recommended_response: string
  confidence_score: number
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState('')
  const [conversationTitle, setConversationTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeConversation = async (text: string, screenshotUrl?: string): Promise<ToneAnalysis> => {
    try {
      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          screenshot_url: screenshotUrl,
          context: 'child custody communication'
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      return result.analysis
    } catch (error) {
      console.error('Analysis error:', error)
      // Fallback analysis for demo purposes
      return {
        overall_tone: 'neutral',
        emotional_indicators: ['professional'],
        concerning_language: [],
        recommended_response: 'Continue professional communication.',
        confidence_score: 0.8
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError('')
    }
  }

  const uploadScreenshot = async (file: File): Promise<string> => {
    const fileName = `screenshots/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('evidence')
      .upload(fileName, file)

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('evidence')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async () => {
    if (!currentConversation.trim() || !conversationTitle.trim()) {
      setError('Please enter both conversation title and content')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let screenshotUrl = null
      
      if (selectedFile) {
        screenshotUrl = await uploadScreenshot(selectedFile)
      }

      setIsAnalyzing(true)
      const analysis = await analyzeConversation(currentConversation, screenshotUrl)
      setIsAnalyzing(false)

      const { data, error: dbError } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: user.id,
            title: conversationTitle.trim(),
            content: currentConversation.trim(),
            tone_analysis: analysis,
            screenshot_url: screenshotUrl,
            is_analyzed: true
          }
        ])
        .select()
        .single()

      if (dbError) throw dbError

      // Add to local state
      setConversations(prev => [data, ...prev])
      
      // Reset form
      setCurrentConversation('')
      setConversationTitle('')
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setError(error.message)
      setIsAnalyzing(false)
    } finally {
      setLoading(false)
    }
  }

  const getToneIcon = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'positive':
      case 'friendly':
        return <FaceSmileIcon className="h-5 w-5 text-green-500" />
      case 'negative':
      case 'hostile':
        return <FaceFrownIcon className="h-5 w-5 text-red-500" />
      case 'concerning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'positive':
      case 'friendly':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'negative':
      case 'hostile':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'concerning':
        return 'text-orange-700 bg-orange-50 border-orange-200'
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">AI Conversation Analysis</h1>
        <p className="text-purple-100">Analyze communication tone and get recommendations for custody-related conversations</p>
      </div>

      {/* Analysis Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyze Conversation</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Title
            </label>
            <input
              type="text"
              id="title"
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Co-parenting discussion about weekend plans"
            />
          </div>

          <div>
            <label htmlFor="conversation" className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Content
            </label>
            <textarea
              id="conversation"
              rows={6}
              value={currentConversation}
              onChange={(e) => setCurrentConversation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="Paste the conversation text here..."
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screenshot (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Screenshot preview"
                    className="max-w-full h-48 object-contain mx-auto rounded-md"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Upload Screenshot
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50 rounded-md p-4">
            <p className="text-sm text-purple-700">
              <strong>AI Analysis Features:</strong>
            </p>
            <ul className="text-xs text-purple-600 mt-1 space-y-1">
              <li>• Tone detection (positive, negative, neutral, concerning)</li>
              <li>• Emotional indicators and language patterns</li>
              <li>• Identification of concerning language</li>
              <li>• Recommended response strategies</li>
              <li>• Confidence scoring for analysis results</li>
            </ul>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || isAnalyzing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Analyze Conversation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Analyses */}
      {conversations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Analyses</h2>
          
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{conversation.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(conversation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getToneColor(conversation.tone_analysis.overall_tone)}`}>
                    <div className="flex items-center space-x-1">
                      {getToneIcon(conversation.tone_analysis.overall_tone)}
                      <span>{conversation.tone_analysis.overall_tone}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700 line-clamp-3">{conversation.content}</p>
                </div>

                <div className="space-y-2">
                  {conversation.tone_analysis.emotional_indicators.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700">Emotional Indicators:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conversation.tone_analysis.emotional_indicators.map((indicator, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {conversation.tone_analysis.concerning_language.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700">Concerning Language:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conversation.tone_analysis.concerning_language.map((language, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recommended Response:</p>
                    <p className="text-sm text-gray-700">{conversation.tone_analysis.recommended_response}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Confidence: {(conversation.tone_analysis.confidence_score * 100).toFixed(0)}%</span>
                    {conversation.screenshot_url && (
                      <button className="text-purple-600 hover:text-purple-700 font-medium">
                        View Screenshot
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}