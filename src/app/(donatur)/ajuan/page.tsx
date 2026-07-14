'use client'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabAjuan } from '@/components/polines/donatur/tab-ajuan'

export default function AjuanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // ⬅ FIX: sama seperti riwayat/page.tsx — sebelumnya halaman ini tidak
  // membaca query param, jadi TabAjuan dipanggil tanpa initialProposalId,
  // padahal komponen itu sudah siap menerimanya untuk auto-buka detail
  // proposal saat datang dari klik notifikasi.
  const searchParams = useSearchParams()
  const proposalIdFromUrl = searchParams.get('proposalId')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabAjuan session={session} initialProposalId={proposalIdFromUrl ?? undefined} />
    </div>
  )
}