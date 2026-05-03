import { useEffect, useState, FormEvent } from 'react'
import Layout from '../../components/Layout'
import { listTechniques, createTechnique, listCategories, createCategory } from '../../api/techniques'
import type { Technique, TechniqueCategory } from '../../api/types'

export default function TechniqueLibrary() {
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [categories, setCategories] = useState<TechniqueCategory[]>([])
  const [filter, setFilter] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category_id: '', reference_url: '' })
  const [newCat, setNewCat] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const [tRes, cRes] = await Promise.all([listTechniques(), listCategories()])
    setTechniques(tRes.data)
    setCategories(cRes.data)
  }

  useEffect(() => { load() }, [])

  const handleCreateTechnique = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createTechnique({
        name: form.name,
        description: form.description || undefined,
        category_id: form.category_id,
        reference_url: form.reference_url || undefined,
      })
      setForm({ name: '', description: '', category_id: '', reference_url: '' })
      setShowForm(false)
      await load()
    } catch {
      setError('Failed to create technique')
    }
  }

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createCategory(newCat)
      setNewCat('')
      setShowCatForm(false)
      await load()
    } catch {
      setError('Category already exists or failed to create')
    }
  }

  const filtered = techniques.filter(
    (t) =>
      t.name.toLowerCase().includes(filter.toLowerCase()) &&
      (filterCat === '' || t.category.id === filterCat),
  )

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Technique Library</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCatForm(!showCatForm); setShowForm(false) }}
            className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg"
          >
            + Category
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowCatForm(false) }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Technique
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showCatForm && (
        <form onSubmit={handleCreateCategory} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category name</label>
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
            Add
          </button>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleCreateTechnique} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input
              type="url"
              value={form.reference_url}
              onChange={(e) => setForm({ ...form, reference_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              Create Technique
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search techniques…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">{t.name}</p>
                {t.description && <p className="text-gray-500 text-sm mt-1">{t.description}</p>}
                {t.reference_url && (
                  <a
                    href={t.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs mt-1 block"
                  >
                    Reference video ↗
                  </a>
                )}
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-4">
                {t.category.name}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-8">No techniques found.</div>
        )}
      </div>
    </Layout>
  )
}
