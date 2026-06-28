import { LaporanPdfDocument, type LaporanPdfRow } from './laporan-pdf-doc'
import type { FundUsage } from '@/components/polines/types'

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Hitung sisa dana berjalan per baris (immutable, tidak mutate variabel luar).
 */
function computeRowsWithBalance(fundUsages: FundUsage[], collectedAmount: number) {
  return (fundUsages || []).reduce<Array<FundUsage & { sisaDana: number }>>((acc, f) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].sisaDana : collectedAmount
    return [...acc, { ...f, sisaDana: prevBalance - f.amount }]
  }, [])
}

interface DownloadLaporanPdfParams {
  campaignTitle: string
  collectedAmount: number
  fundUsages: FundUsage[]
}

/**
 * Generate PDF laporan penggunaan dana dan langsung trigger download di browser.
 * Tidak ada render mode print di halaman dan tidak memunculkan dialog print bawaan browser.
 * Dipakai dari LaporanDetailView (tombol "Cetak Laporan") dan dari tab-laporan
 * list (tombol Print di kolom Aksi).
 */
export async function downloadLaporanPdf({ campaignTitle, collectedAmount, fundUsages }: DownloadLaporanPdfParams) {
  const { pdf } = await import('@react-pdf/renderer')

  const rowsWithBalance = computeRowsWithBalance(fundUsages, collectedAmount)
  const totalUsed = rowsWithBalance.reduce((sum, f) => sum + f.amount, 0)

  const pdfRows: LaporanPdfRow[] = rowsWithBalance.map(r => ({
    id: r.id,
    date: r.date,
    description: r.description,
    amount: r.amount,
    sisaDana: r.sisaDana,
  }))

  const blob = await pdf(
    <LaporanPdfDocument
      campaignTitle={campaignTitle}
      collectedAmount={collectedAmount}
      totalUsed={totalUsed}
      rows={pdfRows}
    />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-${slugify(campaignTitle)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}