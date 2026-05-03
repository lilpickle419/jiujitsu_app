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
