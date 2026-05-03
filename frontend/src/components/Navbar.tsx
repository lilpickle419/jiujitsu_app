import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">Jiu-Jitsu Dashboard</span>
        {user?.role === 'student' && (
          <>
            <Link to="/student" className="text-gray-300 hover:text-white text-sm">This Week</Link>
            <Link to="/student/history" className="text-gray-300 hover:text-white text-sm">History</Link>
          </>
        )}
        {user?.role === 'tutor' && (
          <>
            <Link to="/tutor" className="text-gray-300 hover:text-white text-sm">Students</Link>
            <Link to="/tutor/techniques" className="text-gray-300 hover:text-white text-sm">Techniques</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
