import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/student/Dashboard'
import StudentHistory from './pages/student/History'
import TutorDashboard from './pages/tutor/Dashboard'
import StudentDetail from './pages/tutor/StudentDetail'
import TechniqueLibrary from './pages/tutor/TechniqueLibrary'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/student"
            element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
          />
          <Route
            path="/student/history"
            element={<ProtectedRoute role="student"><StudentHistory /></ProtectedRoute>}
          />

          <Route
            path="/tutor"
            element={<ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>}
          />
          <Route
            path="/tutor/students/:studentId"
            element={<ProtectedRoute role="tutor"><StudentDetail /></ProtectedRoute>}
          />
          <Route
            path="/tutor/techniques"
            element={<ProtectedRoute role="tutor"><TechniqueLibrary /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
