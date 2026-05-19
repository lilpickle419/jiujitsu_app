import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { listJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../../api/journal'
import type { JournalEntry } from '../../api/types'

interface FormState {
  name: string
  description: string
  notes: string
  reference_url: string
}

const emptyForm = (): FormState => ({ name: '', description: '', notes: '', reference_url: '' })

export default function StudentJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await listJournalEntries()
    setEntries(res.data)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setShowForm(true)
  }

  const openEdit = (entry: JournalEntry) => {
    setEditing(entry)
    setForm({
      name: entry.name,
      description: entry.description ?? '',
      notes: entry.notes ?? '',
      reference_url: entry.reference_url ?? '',
    })
    setError('')
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm())
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
        reference_url: form.reference_url.trim() || undefined,
      }
      if (editing) {
        await updateJournalEntry(editing.id, payload)
      } else {
        await createJournalEntry(payload)
      }
      await load()
      handleCancel()
    } catch {
      setError('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Technique Journal</h1>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Add Technique
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editing ? 'Edit Technique' : 'New Technique'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rear Naked Choke"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the technique…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Key details, mistakes to avoid, when to use it…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference URL</label>
              <input
                type="url"
                value={form.reference_url}
                onChange={(e) => setForm((f) => ({ ...f, reference_url: e.target.value }))}
                placeholder="https://youtube.com/…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add to journal'}
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No techniques in your journal yet. Add one to get started.
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-800">{entry.name}</h2>
                {entry.description && (
                  <p className="text-gray-600 text-sm mt-1">{entry.description}</p>
                )}
                {entry.notes && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide mb-1">My notes</p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{entry.notes}</p>
                  </div>
                )}
                {entry.reference_url && (
                  <a
                    href={entry.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Reference video ↗
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-2">{formatDate(entry.created_at)}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  onClick={() => openEdit(entry)}
                  className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
