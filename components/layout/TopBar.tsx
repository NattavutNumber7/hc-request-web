'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { User } from '@/types'

interface TopBarProps {
  user: User
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/requests': 'All Requests',
  '/requests/new': 'New Request',
  '/my-cases': 'My Cases',
  '/dashboard': 'Dashboard',
  '/jd-files': 'JD Files',
  '/status/open': 'Open Requests',
  '/status/recruiting': 'Recruiting',
  '/status/interviewing': 'Interviewing',
  '/status/offering': 'Offering',
  '/status/on-hold': 'On Hold',
  '/status/cancelled': 'Cancelled',
  '/status/closed': 'Closed',
}

function getPageTitle(pathname: string, role: string): string {
  if (pageTitles[pathname]) {
    if (pathname === '/requests' && role === 'manager') {
      return 'My Requests'
    }
    return pageTitles[pathname]
  }
  if (pathname.startsWith('/requests/') && pathname !== '/requests/new') {
    return 'Request Detail'
  }
  return 'HC Request'
}

export default function TopBar({ user, onMenuClick }: TopBarProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname, user.role)

  const initial = user.name_surname?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Right: user avatar */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-gray-600">
          {user.name_surname}
        </span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: '#008065' }}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
