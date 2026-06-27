'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, ChevronLeft } from 'lucide-react'
import type { Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'

interface DonasiDetailViewProps {
  donation: Donation
  onVerify: (id: string, status: 'approved' | 'rejected') => void
  onBack?: () => void
}

export function DonasiDetailView({ donation: initialDonation, onVerify, onBack }: DonasiDetailViewProps) {
  const [donation, setDonation] = useState(initialDonation)

  const handleVerify = (status: 'approved' | 'rejected') => {
    onVerify(donation.id, status)
    setDonation({ ...donation, status })
  }

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Nama',           value: donation.donorName },
    { label: 'Email',          value: donation.donorEmail },
    { label: 'No Telp',        value: donation.donorPhone || '-' },
    { label: 'Tanggal Donasi', value: formatDate(donation.createdAt) },
    { label: 'Campaign',       value: donation.campaign?.title || '-' },
    { label: 'Tipe Donasi', value: (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        donation.type === 'uang' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {donation.type === 'uang' ? 'Uang' : 'Barang'}
      </span>
    )},
    ...(donation.type === 'uang'
      ? [
          { label: 'Metode Pembayaran', value: donation.paymentMethod || '-' },
          { label: 'Nominal',           value: formatRupiah(donation.amount) },
        ]
      : [
          { label: 'Jenis Barang',    value: donation.itemName || '-' },
          { label: 'Jumlah Barang',   value: donation.itemQuantity ? `${donation.itemQuantity} pcs` : (donation.amount ? `${donation.amount} pcs` : '-') },
          { label: 'Alamat Pengirim', value: donation.senderAddress || '-' },
        ]
    ),
    { label: 'Pesan',  value: donation.message || '-' },
    { label: 'Status', value: <Badge className={getStatusColor(donation.status)}>{donation.status}</Badge> },
    ...(donation.proofUrl
  ? [{ label: 'Bukti Donasi', value: (
      <a href={donation.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
        <img
          src={donation.proofUrl}
          alt="Bukti Donasi"
          className="max-h-32 rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
        />
      </a>
    )}]
  : []
),
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        )}
        <h2 className="text-base sm:text-lg font-bold text-gray-800">Detail Donasi</h2>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Fields */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="w-full grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] items-center gap-3 sm:gap-4"
            >
              <span className="text-xs sm:text-sm text-gray-500 font-medium">{label}</span>
              <span className="min-w-0 w-full text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center overflow-hidden">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        {donation.status === 'pending' && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg"
              onClick={() => handleVerify('rejected')}
            >
              <X className="h-4 w-4 mr-1.5" /> Tolak
            </Button>
            <Button
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={() => handleVerify('approved')}
            >
              <Check className="h-4 w-4 mr-1.5" /> Setujui
            </Button>
          </div>
        )}

        {/* Approved/Rejected state */}
        {donation.status !== 'pending' && (
          <div className={`border-t px-4 sm:px-6 py-4 flex items-center gap-2 text-sm font-medium ${
            donation.status === 'approved'
              ? 'border-green-100 bg-green-50 text-green-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}>
            {donation.status === 'approved'
              ? <><Check className="h-4 w-4 shrink-0" /> Donasi telah disetujui</>
              : <><X className="h-4 w-4 shrink-0" /> Donasi telah ditolak</>
            }
          </div>
        )}
      </div>
    </div>
  )
}