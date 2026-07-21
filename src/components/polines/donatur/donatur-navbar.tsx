'use client'

import { usePathname, useRouter } from 'next/navigation'
import { HandHeart, ClipboardList, Star, UserCircle, Megaphone } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { value: '/donasi', label: 'Donasi', icon: HandHeart },
  { value: '/riwayat', label: 'Riwayat', icon: ClipboardList },
  { value: '/rekomendasi', label: 'Rekomendasi', icon: Star },
  { value: '/ajuan', label: 'Ajuan', icon: Megaphone },
  { value: '/profil', label: 'Profil', icon: UserCircle },
]

export function DonaturNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Tabs value={pathname} onValueChange={(v) => router.push(v)} className="mb-6">
      <TabsList className="flex flex-col sm:flex-row sm:flex-nowrap gap-1 h-auto bg-white border p-1 w-full sm:w-auto">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}
            className="text-sm w-full sm:w-auto justify-center sm:justify-center data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <Icon className="h-4 w-4 mr-1.5" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}