import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { listStudents } from '../../api/users'
import { getCurrentWeek } from '../../api/weeks'
import { getStudentWeekAssignments } from '../../api/assignments'
import { getStudentWeekSubmissions } from '../../api/submissions'
import type { User, Week } from '../../api/types'

interface StudentStatus {
  student: User
  assigned: number
  submitted: number
  reviewed: number
}

export default function TutorDashboard() {
  const [statuses, setStatuses] = useState<StudentStatus[]>([])
  const [week, setWeek] = useState<Week | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [studentsRes, weekRes] = await Promise.all([listStudents(), getCurrentWeek()])
      const currentWeek = weekRes.data
      setWeek(currentWeek)
      const statusList = await Promise.all(
        studentsRes.data.map(async (student) => {
          const [assignRes, subRes] = await Promise.all([
            getStudentWeekAssignments(student.id, currentWeek.id),
            getStudentWeekSubmissions(student.id, currentWeek.id),
          ])
          return {
            student,
            assigned: assignRes.data.length,
            submitted: subRes.data.length,
            reviewed: subRes.data.filter((s) => s.review).length,
          }
        }),
      )
      setStatuses(statusList)
      setLoading(false)
    }
    load()
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="animate-spin">⟳</span> Loading…
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        {week && (
          <p className="text-slate-500 text-sm mt-1">
            Week {week.week_number} · {formatDate(week.start_date)} – {formatDate(week.end_date)}
          </p>
        )}
      </div>

      {statuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No students registered yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {statuses.map(({ student, assigned, submitted, reviewed }) => {
            const progress = assigned > 0 ? Math.round((submitted / assigned) * 100) : 0
            return (
              <Link
                key={student.id}
                to={`/tutor/students/${student.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                      {student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-slate-400 text-xs">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-700">{assigned}</p>
                      <p className="text-xs text-slate-400">assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{submitted}</p>
                      <p className="text-xs text-slate-400">submitted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{reviewed}</p>
                      <p className="text-xs text-slate-400">reviewed</p>
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 text-right">{progress}%</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
