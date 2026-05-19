import { useEffect, useState, useRef } from 'react'
import Layout from '../../components/Layout'
import StarRating from '../../components/StarRating'
import { getCurrentWeek } from '../../api/weeks'
import { getMyWeekAssignments } from '../../api/assignments'
import { getMyWeekSubmissions, uploadSubmission, getVideoUrl } from '../../api/submissions'
import { getFeedbackVideoUrl } from '../../api/reviews'
import type { Week, Assignment, Submission } from '../../api/types'

export default function StudentDashboard() {
  const [week, setWeek] = useState<Week | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = async () => {
    try {
      const weekRes = await getCurrentWeek()
      setWeek(weekRes.data)
      const [assignRes, subRes] = await Promise.all([
        getMyWeekAssignments(weekRes.data.id),
        getMyWeekSubmissions(weekRes.data.id),
      ])
      setAssignments(assignRes.data)
      setSubmissions(subRes.data)
    } catch {
      setError('Failed to load week data')
    }
  }

  useEffect(() => { load() }, [])

  const submissionFor = (techniqueId: string) =>
    submissions.find((s) => s.technique.id === techniqueId) ?? null

  const handleUpload = async (techniqueId: string, file: File) => {
    if (!week) return
    setUploading(techniqueId)
    try {
      await uploadSubmission(week.id, techniqueId, file)
      await load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  if (!week) return <Layout><div className="text-gray-500">Loading…</div></Layout>

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Week {week.week_number} — {formatDate(week.start_date)} to {formatDate(week.end_date)}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{assignments.length} technique{assignments.length !== 1 ? 's' : ''} assigned</p>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {assignments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No techniques assigned for this week yet.
        </div>
      )}

      <div className="space-y-6">
        {assignments.map((assignment) => {
          const sub = submissionFor(assignment.technique.id)
          const canUpload = !sub || (sub.review?.requires_resubmission === true)
          const isUploading = uploading === assignment.technique.id

          return (
            <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{assignment.technique.name}</h2>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                    {assignment.technique.category.name}
                  </span>
                </div>
                {sub && !sub.review && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Awaiting review</span>
                )}
                {sub?.review && !sub.review.requires_resubmission && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Reviewed</span>
                )}
                {sub?.review?.requires_resubmission && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Resubmission required</span>
                )}
              </div>

              {assignment.technique.description && (
                <p className="text-gray-600 text-sm mb-3">{assignment.technique.description}</p>
              )}

              {assignment.technique.reference_url && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Reference</p>
                  <a
                    href={assignment.technique.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              )}

              {sub && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Your submission</p>
                  <video
                    src={getVideoUrl(sub.id)}
                    controls
                    className="w-full max-h-64 rounded-lg bg-black"
                  />
                  {sub.review && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Tutor feedback</p>
                      <StarRating value={sub.review.rating} readonly />
                      {sub.review.notes && <p className="text-gray-700 text-sm mt-2">{sub.review.notes}</p>}
                      {sub.review.feedback_video_path && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Feedback video</p>
                          <video
                            src={getFeedbackVideoUrl(sub.review.id)}
                            controls
                            className="w-full max-h-48 rounded-lg bg-black"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canUpload && (
                <div>
                  <input
                    ref={(el) => { fileInputRefs.current[assignment.technique.id] = el }}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(assignment.technique.id, file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[assignment.technique.id]?.click()}
                    disabled={isUploading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                      sub?.review?.requires_resubmission
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? 'Uploading…' : sub ? 'Re-upload video' : 'Upload video'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
