'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, Target, CreditCard, FileText, Bell,
  Heart, Home as HomeIcon, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'

export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaign', label: 'Campaign', icon: Target },
  { id: 'donasi', label: 'Donasi', icon: CreditCard },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
]

interface AdminSidebarProps {
  adminTab: string
  setAdminTab: (tab: string) => void
  unreadCount: number
  session: any
  setView: (v: string) => void
  handleSignOut: () => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

export function AdminSidebar({
  adminTab, setAdminTab, unreadCount, session,
  setView, handleSignOut, collapsed, setCollapsed,
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } bg-gradient-to-b from-teal-700 to-teal-800 text-white`}
    >
      {/* Logo + Collapse Toggle */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
          <Heart className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold leading-tight">Polines Care</h1>
            <p className="text-[10px] text-teal-200 leading-tight">Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon
          const active = adminTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-teal-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-teal-200'}`} />
              {!collapsed && <span>{item.label}</span>}
              {item.id === 'notifikasi' && unreadCount > 0 && (
                <span className={`${collapsed ? 'absolute top-1 right-1' : 'ml-auto'} flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
        <button
          onClick={() => setView('landing')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <HomeIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Lihat Website</span>}
        </button>

        {/* Admin Profile */}
        <div className={`flex items-center gap-3 px-3 py-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-teal-300 truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}