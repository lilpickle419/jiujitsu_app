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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return <Layout><div className="text-gray-500">Loading…</div></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          {week && (
            <p className="text-gray-500 text-sm mt-1">
              Current week: Week {week.week_number} ({formatDate(week.start_date)} – {formatDate(week.end_date)})
            </p>
          )}
        </div>
      </div>

      {statuses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No students registered yet.
        </div>
      )}

      <div className="grid gap-4">
        {statuses.map(({ student, assigned, submitted, reviewed }) => (
          <Link
            key={student.id}
            to={`/tutor/students/${student.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{student.name}</p>
                <p className="text-gray-400 text-sm">{student.email}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{assigned}</p>
                  <p className="text-xs text-gray-400">assigned</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{submitted}</p>
                  <p className="text-xs text-gray-400">submitted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{reviewed}</p>
                  <p className="text-xs text-gray-400">reviewed</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
