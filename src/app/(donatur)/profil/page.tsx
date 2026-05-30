'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { ProfilDonatur } from '@/components/polines/donatur/tab-profil'
import type { Donation } from '@/components/polines/types'

export default function ProfilPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [userDonations, setUserDonations] = useState<Donation[]>([])

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
            <ProfilDonatur session={session} userDonations={userDonations} />
        </div>
    )
}