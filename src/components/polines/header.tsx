'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heart, Menu, X, Bell, LogOut, ChevronDown, LayoutDashboard, Home as HomeIcon } from 'lucide-react'
import { formatDate } from './types'
import type { AppNotification } from './types'
import Image from 'next/image'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (session?.user) {
      fetch('/api/notifications')
        .then(r => r.json())
        .then(d => setNotifications(d.notifications || []))
    }
  }, [session])

  const markNotificationRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: [id] })
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllNotificationsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true })
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleSignOut = async () => {
  await signOut({ callbackUrl: '/' })
}

  const handleLogoClick = () => {
    if (!session?.user) router.push('/')
    else if (session.user.role === 'admin') router.push('/admin/dashboard')
    else router.push('/dashboard')
  }

  const handleDashboardClick = () => {
    if (session?.user?.role === 'admin') router.push('/admin/dashboard')
    else router.push('/dashboard')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <Image src="/Logo_PolinesCare.png" alt="Polines Care" width={75} height={75} className="object-contain" />
          <span className="text-xl font-bold bg-linear-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Polines Care
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleDashboardClick}>
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/home')}>
                <HomeIcon className="h-4 w-4 mr-1" /> Lihat Website
              </Button>

              {/* Notification Bell */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {notifDropdownOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-lg border bg-white shadow-lg z-50">
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifikasi</span>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-6"
                          onClick={markAllNotificationsRead}>
                          Tandai semua dibaca
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="max-h-80">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">Tidak ada notifikasi</p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div key={n.id}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-teal-50/50' : ''}`}
                            onClick={() => markNotificationRead(n.id)}>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {session.user.role === 'admin' ? 'Admin' : 'Donatur'}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>Masuk</Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => router.push('/register')}>Daftar</Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
          {session?.user ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-sm">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start"
                onClick={() => { handleDashboardClick(); setMobileMenuOpen(false) }}>
                <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start"
                onClick={() => { router.push('/home'); setMobileMenuOpen(false) }}>
                <HomeIcon className="h-4 w-4 mr-2" /> Lihat Website
              </Button>
              <Button variant="ghost" className="w-full justify-start text-red-600"
                onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}>
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full justify-start"
                onClick={() => { router.push('/login'); setMobileMenuOpen(false) }}>Masuk</Button>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => { router.push('/register'); setMobileMenuOpen(false) }}>Daftar</Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}