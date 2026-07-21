'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabAjuan } from '@/components/polines/donatur/tab-ajuan'

export default function AjuanContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const searchParams = useSearchParams()
  const proposalIdFromUrl = searchParams.get('proposalId')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabAjuan
        session={session}
        initialProposalId={proposalIdFromUrl ?? undefined}
      />
    </div>
  )
}