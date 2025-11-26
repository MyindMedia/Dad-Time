import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { analyzeConversationScreenshot, rewriteResponseVoss } from '../lib/openai'

export default function AIConversations() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [rewrite, setRewrite] = useState<any>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      setImagePreview(reader.result as string)
      setLoading(true)
      try {
        const analysis = await analyzeConversationScreenshot(base64)
        setResult(analysis)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const path = `screenshots/${user.id}/${Date.now()}.png`
        const uploadRes = await supabase.storage.from('evidence').upload(path, file)
        if (uploadRes.error) throw uploadRes.error
        await supabase.from('evidence').insert({
          user_id: user.id,
          child_id: null,
          type: 'screenshot',
          source_app: 'manual',
          file_id: path,
          text_preview: analysis.summary,
          notes: null,
          tags: null
        })
      } catch (err) {
        console.error(err)
        alert('Analysis failed. Ensure evidence bucket exists and OpenAI key is set.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Conversation Analysis</h1>
        <p className="text-gray-600 mb-8">Upload conversation screenshots for AI-powered analysis</p>

        <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer inline-flex items-center space-x-2">
          <span>Upload Screenshot</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>

        {imagePreview && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <img src={imagePreview} alt="Preview" className="rounded-md border" />
            <div>
              {loading && <p className="text-blue-600">Analyzing…</p>}
              {result && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Tone</div>
                    <div className="text-sm text-gray-700">{result.tone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Summary</div>
                    <div className="text-sm text-gray-700">{result.summary}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Key Points</div>
                    <ul className="text-sm text-gray-700 list-disc pl-5">
                      {result.key_points?.map((kp: string, i: number) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Rewrite Your Reply (Voss Method)</div>
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-md" placeholder="Type your draft reply here" />
                    <div className="mt-2">
                      <button
                        disabled={loading || !draft}
                        onClick={async () => {
                          setLoading(true)
                          try {
                            const suggestions = await rewriteResponseVoss(draft, { summary: result.summary, tone: result.tone, key_points: result.key_points })
                            setRewrite(suggestions)
                          } catch (e) {
                            alert('Failed to generate rewrite')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                      >
                        Rewrite with Voss Method
                      </button>
                    </div>
                    {rewrite && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Primary</div>
                          <div className="text-sm text-gray-700">{rewrite.primary}</div>
                        </div>
                        {rewrite.calibrated_questions?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Calibrated Questions</div>
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                              {rewrite.calibrated_questions.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                            </ul>
                          </div>
                        )}
                        {rewrite.labels?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Labels</div>
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                              {rewrite.labels.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                            </ul>
                          </div>
                        )}
                        {rewrite.mirrors?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Mirrors</div>
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                              {rewrite.mirrors.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                            </ul>
                          </div>
                        )}
                        {rewrite.alternatives?.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Alternatives</div>
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                              {rewrite.alternatives.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                            </ul>
                          </div>
                        )}
                        {rewrite.summary_statement && (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Summary Statement</div>
                            <div className="text-sm text-gray-700">{rewrite.summary_statement}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
