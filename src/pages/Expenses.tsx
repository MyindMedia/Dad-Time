import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PlusIcon, TrashIcon, EyeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import ChildSelector from '../components/ChildSelector'

interface Expense {
  id: string
  receipt_image_id: string | null
  category: string
  amount: number
  date: string
  reimbursement_status: string | null
  created_at: string
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [childId, setChildId] = useState<string | null>(null)

  const categories = [
    'Food & Dining',
    'Transportation',
    'Medical',
    'Education',
    'Clothing',
    'Entertainment',
    'Other'
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fileName = `${user.id}/${Date.now()}-${file.name}`
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      // Create expense record aligned to existing schema
      const { error: insertError } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            child_id: childId,
            date: new Date().toISOString(),
            amount: 0,
            category: 'other',
            merchant_name: null,
            payment_method: null,
            receipt_image_id: fileName,
            reimbursement_status: 'not_requested',
            notes: null
          }
        ])

      if (insertError) throw insertError

      fetchExpenses()
      alert('Receipt uploaded successfully! Please edit the expense details.')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'not_requested': return 'bg-gray-100 text-gray-800'
      case 'requested': return 'bg-yellow-100 text-yellow-800'
      case 'partial': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer inline-flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Upload Receipt</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <div className="mb-6">
          <ChildSelector value={childId} onChange={setChildId} />
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses recorded</h3>
            <p className="text-gray-600">Upload your first receipt to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <img
                    src={expense.receipt_image_id ? supabase.storage.from('receipts').getPublicUrl(expense.receipt_image_id).data.publicUrl : ''}
                    alt="Receipt"
                    className="w-full h-32 object-cover rounded-md bg-gray-100"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA2MEw5MyA2NkwxMDUgNTRNMTA1IDU0TDEyMSA3ME0xMDUgNTRMMTIxIDM4IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUMzQUZGIiBmb250LXNpemU9IjEyIj5SZWNlaXB0PC90ZXh0Pgo8L3N2Zz4K'
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.reimbursement_status)}`}>
                      {expense.reimbursement_status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">{expense.category}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                  
                  <div className="flex space-x-2 pt-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
