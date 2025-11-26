import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Child = { id: string; full_name: string }

interface Props {
  value: string | null
  onChange: (id: string | null) => void
}

export default function ChildSelector({ value, onChange }: Props) {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('children').select('id, full_name').eq('user_id', user.id).order('full_name')
      if (error) throw error
      setChildren(data || [])
    } finally {
      setLoading(false)
    }
  }

  const add = async () => {
    if (!newName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('children').insert({ user_id: user.id, full_name: newName.trim() }).select('id, full_name').single()
    if (!error && data) {
      setChildren((prev) => [...prev, data])
      onChange(data.id)
      setNewName('')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Child</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select child (optional)</option>
        {children.map((c) => (
          <option key={c.id} value={c.id}>{c.full_name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add new child"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <button onClick={add} className="px-3 py-2 rounded-md bg-blue-600 text-white">Add</button>
      </div>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
    </div>
  )
}
