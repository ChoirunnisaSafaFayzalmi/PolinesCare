import { Suspense } from 'react'
import AjuanContent from './ajuancontent'

export default function AjuanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AjuanContent />
    </Suspense>
  )
}