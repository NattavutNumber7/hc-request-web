'use client'

import { useState } from 'react'
import { User } from '@/types'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

export default function Layout({ user, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f3eae3]">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        <TopBar
          user={user}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
