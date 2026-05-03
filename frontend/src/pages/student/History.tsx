import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StarRating from '../../components/StarRating'
import { listWeeks, getCurrentWeek } from '../../api/weeks'
import { getMyWeekAssignments } from '../../api/assignments'
import { getMyWeekSubmissions, getVideoUrl } from '../../api/submissions'
import type { Week, Assignment, Submission } from '../../api/types'

interface WeekData {
  week: Week
  assignments: Assignment[]
  submissions: Submission[]
}

export default function StudentHistory() {
  const [pastWeeks, setPastWeeks] = useState<Week[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [weekData, setWeekData] = useState<Record<string, WeekData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listWeeks(), getCurrentWeek()]).then(([allRes, curRes]) => {
      const current = curRes.data
      const past = allRes.data.filter(
        (w) => w.year < current.year || (w.year === current.year && w.week_number < current.week_number),
      )
      setPastWeeks(past)
      setLoading(false)
    })
  }, [])

  const loadWeek = async (week: Week) => {
    if (weekData[week.id]) return
    const [assignRes, subRes] = await Promise.all([
      getMyWeekAssignments(week.id),
      getMyWeekSubmissions(week.id),
    ])
    setWeekData((prev) => ({
      ...prev,
      [week.id]: { week, assignments: assignRes.data, submissions: subRes.data },
    }))
  }

  const toggle = async (week: Week) => {
    if (expanded === week.id) {
      setExpanded(null)
    } else {
      await loadWeek(week)
      setExpanded(week.id)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return <Layout><div className="text-gray-500">Loading…</div></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">History</h1>

      {pastWeeks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No past weeks yet.
        </div>
      )}

      <div className="space-y-3">
        {pastWeeks.map((week) => {
          const data = weekData[week.id]
          const isOpen = expanded === week.id

          return (
            <div key={week.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(week)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    Week {week.week_number}, {week.year}
                  </span>
                  <span className="text-gray-400 text-sm ml-3">
                    {formatDate(week.start_date)} – {formatDate(week.end_date)}
                  </span>
                </div>
                <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && data && (
                <div className="border-t border-gray-100 px-6 py-4 space-y-4">
                  {data.assignments.length === 0 && (
                    <p className="text-gray-400 text-sm">No techniques assigned this week.</p>
                  )}
                  {data.assignments.map((assignment) => {
                    const sub = data.submissions.find((s) => s.technique.id === assignment.technique.id)
                    return (
                      <div key={assignment.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-800">{assignment.technique.name}</span>
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {assignment.technique.category.name}
                          </span>
                        </div>
                        {sub ? (
                          <>
                            <video
                              src={getVideoUrl(sub.id)}
                              controls
                              className="w-full max-h-48 rounded bg-black mb-2"
                            />
                            {sub.review ? (
                              <div className="bg-gray-50 rounded p-3">
                                <StarRating value={sub.review.rating} readonly />
                                {sub.review.notes && (
                                  <p className="text-gray-600 text-sm mt-1">{sub.review.notes}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-yellow-600 text-xs">Not yet reviewed</p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-400 text-sm">No submission</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
