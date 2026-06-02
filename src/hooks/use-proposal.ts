// hooks/useProposals.ts
import { useState, useEffect, useCallback } from 'react'

export interface Proposal {
  id: string
  title: string
  description: string
  category: string
  targetAmount: number
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  resubmittedFrom: string | null
  startDate: string
  endDate: string
  campaignLocation: string
  officialDocUrl: string
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/proposals/my')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memuat data')
      }
      const data = await res.json()
      setProposals(data.proposals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProposals() }, [fetchProposals])

  return { proposals, loading, error, refetch: fetchProposals }
}