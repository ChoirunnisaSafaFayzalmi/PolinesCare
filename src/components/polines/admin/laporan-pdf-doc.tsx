import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatRupiah, formatDate } from '@/components/polines/types'

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488',
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8.5,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#111827',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tableFooterRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  colNo: { width: '6%' },
  colTipe: { width: '10%' },
  colTanggal: { width: '12%' },
  colKeterangan: { width: '32%' },
  colNominal: { width: '20%', textAlign: 'right' },
  colSisaDana: { width: '20%', textAlign: 'right' },
  cellHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 9,
    color: '#1f2937',
  },
  cellMuted: {
    fontSize: 8.5,
    color: '#6b7280',
  },
  cellNominal: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
    textAlign: 'right',
  },
  footerLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  emptyState: {
    padding: 24,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
  },
  generatedAt: {
    marginTop: 24,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'right',
  },
})

export interface LaporanPdfRow {
  id: string
  type: string // 'uang' | 'barang'
  date: string
  description: string
  amount: number | null
  itemName?: string | null
  itemQuantity?: number | null
  sisaDana: number
}

interface LaporanPdfDocumentProps {
  campaignTitle: string
  collectedAmount: number
  totalUsed: number
  rows: LaporanPdfRow[]
}

export function LaporanPdfDocument({ campaignTitle, collectedAmount, totalUsed, rows }: LaporanPdfDocumentProps) {
  const sisaDana = collectedAmount - totalUsed
  const generatedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>Polines Care</Text>
          </View>
          <Text style={styles.title}>Laporan Penggunaan Dana</Text>
          <Text style={styles.subtitle}>{campaignTitle}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Terkumpul</Text>
            <Text style={[styles.summaryValue, { color: '#0d9488' }]}>{formatRupiah(collectedAmount)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Digunakan</Text>
            <Text style={[styles.summaryValue, { color: '#ea580c' }]}>{formatRupiah(totalUsed)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Sisa Dana</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{formatRupiah(sisaDana)}</Text>
          </View>
        </View>

        {/* Table */}
        <Text style={styles.sectionTitle}>Rincian Penggunaan Dana</Text>
        <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: -6, marginBottom: 8 }}>
          Kolom &quot;Sisa Dana&quot; hanya berlaku untuk entri bertipe Uang.
        </Text>

        {rows.length === 0 ? (
          <View style={styles.table}>
            <Text style={styles.emptyState}>Belum ada laporan penggunaan dana</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.cellHeader, styles.colNo]}>No</Text>
              <Text style={[styles.cellHeader, styles.colTipe]}>Tipe</Text>
              <Text style={[styles.cellHeader, styles.colTanggal]}>Tanggal</Text>
              <Text style={[styles.cellHeader, styles.colKeterangan]}>Keterangan</Text>
              <Text style={[styles.cellHeader, styles.colNominal]}>Nominal / Jumlah</Text>
              <Text style={[styles.cellHeader, styles.colSisaDana]}>Sisa Dana</Text>
            </View>

            {rows.map((r, idx) => (
              <View style={styles.tableRow} key={r.id} wrap={false}>
                <Text style={[styles.cellMuted, styles.colNo]}>{idx + 1}</Text>
                <Text style={[styles.cellMuted, styles.colTipe]}>{r.type === 'barang' ? 'Barang' : 'Uang'}</Text>
                <Text style={[styles.cellMuted, styles.colTanggal]}>{formatDate(r.date)}</Text>
                <Text style={[styles.cellText, styles.colKeterangan]}>{r.description}</Text>
                <Text style={[styles.cellNominal, styles.colNominal]}>
                  {r.type === 'barang' ? `${r.itemQuantity ?? ''} ${r.itemName ?? ''}`.trim() : formatRupiah(r.amount ?? 0)}
                </Text>
                <Text style={[styles.cellText, styles.colSisaDana, { textAlign: 'right' }]}>
                  {r.type === 'barang' ? '—' : formatRupiah(r.sisaDana)}
                </Text>
              </View>
            ))}

            <View style={styles.tableFooterRow}>
              <Text style={[styles.footerLabel, { width: '54%', textAlign: 'right' }]}>TOTAL DIGUNAKAN (Uang)</Text>
              <Text style={[styles.cellNominal, styles.colNominal]}>{formatRupiah(totalUsed)}</Text>
              <Text style={styles.colSisaDana} />
            </View>
          </View>
        )}

        <Text style={styles.generatedAt}>Dicetak pada {generatedAt}</Text>
      </Page>
    </Document>
  )
}