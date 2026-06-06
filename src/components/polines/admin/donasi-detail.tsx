'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, X } from 'lucide-react'
import type { Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'

interface DonasiDetailViewProps {
  donation: Donation
  onVerify: (id: string, status: 'approved' | 'rejected') => void
}

export function DonasiDetailView({ donation: initialDonation, onVerify }: DonasiDetailViewProps) {
  const [donation, setDonation] = useState(initialDonation)

  const handleVerify = (status: 'approved' | 'rejected') => {
    onVerify(donation.id, status)
    setDonation({ ...donation, status })
  }

  const fields = [
    { label: 'Nama Donatur', value: donation.donorName },
    { label: 'Email', value: donation.donorEmail },
    { label: 'No Telp', value: donation.donorPhone || '-' },
    { label: 'Tanggal Donasi', value: formatDate(donation.createdAt) },
    { label: 'Campaign', value: donation.campaign?.title || '-' },
    { label: 'Metode Pembayaran', value: donation.paymentMethod || '-' },
    { label: 'Nominal', value: formatRupiah(donation.amount) },
    { label: 'Pesan', value: donation.message || '-' },
  ]

  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-6">
        <div className="max-w-2xl space-y-6">
          {/* Actions */}
          {donation.status === 'pending' && (
            <div className="flex justify-end gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                onClick={() => handleVerify('approved')}>
                <Check className="h-4 w-4 mr-1" /> Setujui
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                onClick={() => handleVerify('rejected')}>
                <X className="h-4 w-4 mr-1" /> Tolak
              </Button>
            </div>
          )}

          {/* Detail Fields */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            {fields.map(({ label, value }, i) => (
              <div key={label}>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0 text-sm">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
                {i < fields.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {/* Tipe Donasi */}
            <Separator />
            <div className="flex items-start">
              <span className="text-gray-500 w-40 flex-shrink-0 text-sm">Tipe Donasi</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                donation.type === 'uang' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {donation.type}
              </span>
            </div>

            {/* Status */}
            <Separator />
            <div className="flex items-start">
              <span className="text-gray-500 w-40 flex-shrink-0 text-sm">Status</span>
              <Badge className={getStatusColor(donation.status)}>{donation.status}</Badge>
            </div>

            {/* Bukti Transfer */}
            {donation.proofUrl && (
              <>
                <Separator />
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0 text-sm">Bukti Transfer</span>
                  <a href={donation.proofUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                    Lihat Bukti
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}