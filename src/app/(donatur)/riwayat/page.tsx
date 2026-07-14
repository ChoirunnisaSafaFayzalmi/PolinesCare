'use client'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabRiwayat } from '@/components/polines/donatur/tab-riwayat'
import type { Donation } from '@/components/polines/types'

export default function RiwayatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userDonations, setUserDonations] = useState<Donation[]>([])

  // ⬅ FIX: sebelumnya halaman ini tidak membaca query param sama sekali,
  // jadi walau header.tsx sudah redirect ke /riwayat?donationId=..., halaman
  // ini tidak tahu donasi mana yang harus di-highlight — TabRiwayat dipanggil
  // tanpa highlightDonationId, padahal komponen itu sudah siap menerimanya
  // (untuk auto-scroll + highlight baris) sejak sebelumnya.
  const searchParams = useSearchParams()
  const donationIdFromUrl = searchParams.get('donationId')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/donations').then(r => r.json()).then(d =>
      setUserDonations((d.donations || []).filter((x: Donation) => x.userId === session.user.id))
    )
  }, [session])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabRiwayat userDonations={userDonations} highlightDonationId={donationIdFromUrl ?? undefined} />
    </div>
  )
}