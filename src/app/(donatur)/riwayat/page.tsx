import { Suspense } from 'react'
import RiwayatContent from './riwayatcontent'

export default function RiwayatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RiwayatContent />
    </Suspense>
  )
}