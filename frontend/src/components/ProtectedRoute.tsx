import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: JSX.Element
  role?: 'student' | 'tutor'
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace />

  return children
}
