export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'tutor'
  created_at: string
}

export interface Week {
  id: string
  week_number: number
  year: number
  start_date: string
  end_date: string
}

export interface TechniqueCategory {
  id: string
  name: string
}

export interface Technique {
  id: string
  name: string
  description: string | null
  category: TechniqueCategory
  reference_url: string | null
  created_at: string
}

export interface Assignment {
  id: string
  week: Week
  technique: Technique
  assigned_at: string
}

export interface Review {
  id: string
  rating: number
  notes: string | null
  requires_resubmission: boolean
  feedback_video_path: string | null
  created_at: string
  updated_at: string | null
}

export interface JournalEntry {
  id: string
  name: string
  description: string | null
  notes: string | null
  reference_url: string | null
  created_at: string
  updated_at: string | null
}

export interface Submission {
  id: string
  student_id: string
  week: Week
  technique: Technique
  uploaded_at: string
  review: Review | null
}
