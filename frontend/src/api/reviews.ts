import client from './client'
import type { Review } from './types'

export const createReview = (
  submissionId: string,
  data: { rating: number; notes?: string; requires_resubmission: boolean },
) => client.post<Review>(`/reviews/submission/${submissionId}`, data)

export const updateReview = (
  reviewId: string,
  data: { rating: number; notes?: string; requires_resubmission: boolean },
) => client.put<Review>(`/reviews/${reviewId}`, data)

export const uploadFeedbackVideo = (reviewId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Review>(`/reviews/${reviewId}/feedback-video`, form)
}

export const getFeedbackVideoUrl = (reviewId: string) => {
  const token = localStorage.getItem('token')
  return `/api/reviews/${reviewId}/feedback-video?token=${token}`
}
