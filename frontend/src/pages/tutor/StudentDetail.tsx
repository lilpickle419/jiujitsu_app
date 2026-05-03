import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StarRating from '../../components/StarRating'
import { listWeeks, getCurrentWeek, getNextWeek } from '../../api/weeks'
import { getStudentWeekAssignments, removeAssignment, assignTechniques } from '../../api/assignments'
import { getStudentWeekSubmissions, getVideoUrl } from '../../api/submissions'
import { createReview, updateReview } from '../../api/reviews'
import { listTechniques } from '../../api/techniques'
import { listStudents } from '../../api/users'
import type { Week, Assignment, Submission, Technique, User } from '../../api/types'

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>()
  const [student, setStudent] = useState<User | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [allTechniques, setAllTechniques] = useState<Technique[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])
  const [reviewState, setReviewState] = useState<Record<string, { rating: number; notes: string; requires_resubmission: boolean }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const [studentsRes, currentRes, nextRes, allWeeksRes, techRes] = await Promise.all([
        listStudents(),
        getCurrentWeek(),
        getNextWeek(),
        listWeeks(),
        listTechniques(),
      ])
      const found = studentsRes.data.find((s) => s.id === studentId) ?? null
      setStudent(found)
      setAllTechniques(techRes.data)

      const allWeeks = allWeeksRes.data
      const weekIds = new Set(allWeeks.map((w) => w.id))
      const merged: Week[] = [...allWeeks]
      if (!weekIds.has(currentRes.data.id)) merged.push(currentRes.data)
      if (!weekIds.has(nextRes.data.id)) merged.push(nextRes.data)
      merged.sort((a, b) => b.year - a.year || b.week_number - a.week_number)
      setWeeks(merged)
      setSelectedWeek(currentRes.data)
      setLoading(false)
    }
    init()
  }, [studentId])

  useEffect(() => {
    if (!selectedWeek || !studentId) return
    Promise.all([
      getStudentWeekAssignments(studentId, selectedWeek.id),
      getStudentWeekSubmissions(studentId, selectedWeek.id),
    ]).then(([aRes, sRes]) => {
      setAssignments(aRes.data)
      setSubmissions(sRes.data)
    })
  }, [selectedWeek, studentId])

  const submissionFor = (techniqueId: string) =>
    submissions.find((s) => s.technique.id === techniqueId) ?? null

  const handleRemove = async (assignmentId: string) => {
    await removeAssignment(assignmentId)
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
  }

  const handleAssign = async () => {
    if (!selectedWeek || !studentId || selectedTechIds.length === 0) return
    await assignTechniques({ student_id: studentId, week_id: selectedWeek.id, technique_ids: selectedTechIds })
    const res = await getStudentWeekAssignments(studentId, selectedWeek.id)
    setAssignments(res.data)
    setSelectedTechIds([])
    setShowAssign(false)
  }

  const handleReview = async (sub: Submission) => {
    const state = reviewState[sub.id]
    if (!state) return
    if (sub.review) {
      await updateReview(sub.review.id, state)
    } else {
      await createReview(sub.id, state)
    }
    const sRes = await getStudentWeekSubmissions(studentId!, selectedWeek!.id)
    setSubmissions(sRes.data)
  }

  const initReviewState = (sub: Submission) => {
    if (!reviewState[sub.id]) {
      setReviewState((prev) => ({
        ...prev,
        [sub.id]: {
          rating: sub.review?.rating ?? 3,
          notes: sub.review?.notes ?? '',
          requires_resubmission: sub.review?.requires_resubmission ?? false,
        },
      }))
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return <Layout><div className="text-gray-500">Loading…</div></Layout>
  if (!student) return <Layout><div className="text-red-500">Student not found</div></Layout>

  const assignedIds = new Set(assignments.map((a) => a.technique.id))

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/tutor" className="text-blue-600 hover:underline text-sm">← Back to students</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
          <p className="text-gray-400 text-sm">{student.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWeek?.id ?? ''}
            onChange={(e) => setSelectedWeek(weeks.find((w) => w.id === e.target.value) ?? null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.week_number}, {w.year} ({formatDate(w.start_date)} – {formatDate(w.end_date)})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Assign Techniques
          </button>
        </div>
      </div>

      {showAssign && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-blue-800 mb-3">
            Assign techniques for Week {selectedWeek?.week_number}
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-3">
            {allTechniques
              .filter((t) => !assignedIds.has(t.id))
              .map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer bg-white rounded p-2 border border-blue-100">
                  <input
                    type="checkbox"
                    checked={selectedTechIds.includes(t.id)}
                    onChange={(e) =>
                      setSelectedTechIds((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                      )
                    }
                  />
                  <span className="text-sm text-gray-700">{t.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{t.category.name}</span>
                </label>
              ))}
          </div>
          {allTechniques.filter((t) => !assignedIds.has(t.id)).length === 0 && (
            <p className="text-sm text-gray-500 mb-3">All techniques are already assigned.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAssign}
              disabled={selectedTechIds.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Assign {selectedTechIds.length > 0 ? `(${selectedTechIds.length})` : ''}
            </button>
            <button
              onClick={() => { setShowAssign(false); setSelectedTechIds([]) }}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No techniques assigned for this week.
        </div>
      )}

      <div className="space-y-6">
        {assignments.map((assignment) => {
          const sub = submissionFor(assignment.technique.id)
          const rs = reviewState[sub?.id ?? ''] ?? null

          return (
            <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{assignment.technique.name}</h2>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                    {assignment.technique.category.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(assignment.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              {assignment.technique.reference_url && (
                <a
                  href={assignment.technique.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Reference video ↗
                </a>
              )}

              {!sub && (
                <p className="text-gray-400 text-sm mt-4">No submission yet</p>
              )}

              {sub && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Student submission</p>
                  <video src={getVideoUrl(sub.id)} controls className="w-full max-h-64 rounded-lg bg-black mb-3" />

                  <div
                    className="border border-gray-200 rounded-lg p-4"
                    onFocus={() => initReviewState(sub)}
                    onClick={() => initReviewState(sub)}
                  >
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {sub.review ? 'Update review' : 'Leave a review'}
                    </p>
                    <StarRating
                      value={rs?.rating ?? sub.review?.rating ?? 0}
                      onChange={(v) =>
                        setReviewState((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], rating: v } }))
                      }
                    />
                    <textarea
                      rows={3}
                      placeholder="Notes for the student…"
                      value={rs?.notes ?? sub.review?.notes ?? ''}
                      onChange={(e) =>
                        setReviewState((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], notes: e.target.value } }))
                      }
                      className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rs?.requires_resubmission ?? sub.review?.requires_resubmission ?? false}
                        onChange={(e) =>
                          setReviewState((prev) => ({
                            ...prev,
                            [sub.id]: { ...prev[sub.id], requires_resubmission: e.target.checked },
                          }))
                        }
                      />
                      <span className="text-sm text-gray-600">Requires resubmission</span>
                    </label>
                    <button
                      onClick={() => handleReview(sub)}
                      disabled={!rs}
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {sub.review ? 'Update review' : 'Submit review'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
