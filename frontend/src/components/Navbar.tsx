import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/student' && to !== '/tutor' && location.pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-5 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs tracking-wide">
            BJJ
          </div>
          <span className="text-white font-semibold text-sm leading-none">Jiu-Jitsu Dojo</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {user?.role === 'student' && (
          <>
            <NavLink to="/student" label="This Week" icon="📅" />
            <NavLink to="/student/history" label="History" icon="📋" />
            <NavLink to="/student/journal" label="My Journal" icon="📓" />
          </>
        )}
        {user?.role === 'tutor' && (
          <>
            <NavLink to="/tutor" label="Students" icon="👥" />
            <NavLink to="/tutor/techniques" label="Techniques" icon="🥋" />
          </>
        )}
      </nav>

      <div className="px-4 pb-5 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
