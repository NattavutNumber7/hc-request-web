'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Plus,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Users,
  Circle,
  Hand,
  Search,
  MessageSquare,
  Gift,
  XCircle,
  CheckCircle,
  LogOut,
} from 'lucide-react'
import { User } from '@/types'
import { signOut } from '@/lib/auth'

interface SidebarProps {
  user: User
  open?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const managerNav: NavItem[] = [
  { label: 'New Request', href: '/requests/new', icon: <Plus size={18} /> },
  { label: 'My Requests', href: '/requests', icon: <ClipboardList size={18} /> },
  { label: 'JD Files', href: '/jd-files', icon: <FileText size={18} /> },
]

const fullNav: NavItem[] = [
  { label: 'All Requests', href: '/requests', icon: <ClipboardList size={18} /> },
  { label: 'My Cases', href: '/my-cases', icon: <Users size={18} /> },
  { label: 'New Request', href: '/requests/new', icon: <Plus size={18} /> },
  { label: 'Open', href: '/status/open', icon: <Circle size={18} /> },
  { label: 'Recruiting', href: '/status/recruiting', icon: <Search size={18} /> },
  { label: 'Interviewing', href: '/status/interviewing', icon: <MessageSquare size={18} /> },
  { label: 'Offering', href: '/status/offering', icon: <Gift size={18} /> },
  { label: 'On Hold', href: '/status/on-hold', icon: <Hand size={18} /> },
  { label: 'Cancelled', href: '/status/cancelled', icon: <XCircle size={18} /> },
  { label: 'Closed', href: '/status/closed', icon: <CheckCircle size={18} /> },
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'JD Files', href: '/jd-files', icon: <FileText size={18} /> },
]

export default function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const navItems = user.role === 'manager' ? managerNav : fullNav

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* App name */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold" style={{ color: '#008065' }}>
            HC Request
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-[#008065] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name_surname}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.department}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
