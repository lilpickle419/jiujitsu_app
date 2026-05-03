import client from './client'
import type { Assignment } from './types'

export const assignTechniques = (data: {
  student_id: string
  week_id: string
  technique_ids: string[]
}) => client.post<Assignment[]>('/assignments', data)

export const getStudentWeekAssignments = (studentId: string, weekId: string) =>
  client.get<Assignment[]>(`/assignments/student/${studentId}/week/${weekId}`)

export const getMyWeekAssignments = (weekId: string) =>
  client.get<Assignment[]>(`/assignments/my/week/${weekId}`)

export const removeAssignment = (assignmentId: string) =>
  client.delete(`/assignments/${assignmentId}`)
