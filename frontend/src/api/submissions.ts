import client from './client'
import type { Submission } from './types'

export const uploadSubmission = (weekId: string, techniqueId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Submission>(
    `/submissions?week_id=${weekId}&technique_id=${techniqueId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
}

export const getStudentWeekSubmissions = (studentId: string, weekId: string) =>
  client.get<Submission[]>(`/submissions/student/${studentId}/week/${weekId}`)

export const getMyWeekSubmissions = (weekId: string) =>
  client.get<Submission[]>(`/submissions/my/week/${weekId}`)

export const getVideoUrl = (submissionId: string) => {
  const token = localStorage.getItem('token')
  return `/api/submissions/${submissionId}/video?token=${token}`
}
