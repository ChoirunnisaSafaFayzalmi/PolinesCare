// ============================================================
// TYPES
// ============================================================
export interface User {
  id: string; email: string; name: string; role: string; phone?: string; avatar?: string; address?: string;
}

export interface PaymentMethod {
  key: string
  label: string
  accountNumber: string
  isVisible: boolean
}

export interface Campaign {
  id: string
  title: string
  description: string
  category: string
  targetAmount: number
  collectedAmount: number
  startDate: string
  endDate: string
  images: string[] | null       // JSON array string: '["url1","url2"]'
  location?: string
  dropOffLocation?: string  // alamat tujuan pengiriman barang donasi
  status: string
  isUrgent: boolean
  isPublic: boolean
  uniqueCode: number
  createdBy: string
  creator?: { name: string }
  _count?: { donations: number }
  paymentMethods: PaymentMethod[]
}

export interface Donation {
  id: string
  campaignId: string
  userId: string
  amount: number
  donorName: string
  donorEmail: string
  donorPhone: string
  type: string              // 'uang' | 'barang'
  paymentMethod: string
  proofUrl?: string
  status: string            // 'pending' | 'approved' | 'rejected'
  message?: string
  createdAt: string
  // Khusus donasi barang
  itemName?: string         // jenis barang
  itemQuantity?: number     // jumlah barang
  senderAddress?: string    // alamat pengirim barang
  // Relasi
  campaign?: { title: string; category: string }
}

export interface Proposal {
  id: string
  title: string
  description: string
  category: string
  targetAmount?: number
  proposedBy: string
  votesCount: number
  status: string
  createdAt: string
  rejectionReason?: string
  proposer?: {
    id?: string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    avatar?: string | null
  } | null
  // Data pengaju
  proposerName?: string | null
  proposerEmail?: string | null
  proposerPhone?: string | null
  proposerAddress?: string | null
  // Detail campaign yang diajukan
  startDate?: string
  endDate?: string
  campaignLocation?: string
  photoUrls?: string | string[] | null
  officialDocUrl?: string
  // Penilaian (0–100)
  kejelasanTujuan?: number
  kelayakanAnggaran?: number
  urgensi?: number
  keterkaitanKampus?: number
  kontribusiSosial?: number
}

export interface AppNotification {
  id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string;
}

export interface RecommendedCampaign extends Campaign {
  score?: number
  reason?: string
  matchPercentage?: number
}

export interface FundUsage {
  id: string; campaignId: string; description: string; amount: number;
  date: string; documentUrl?: string; campaign?: { title: string };
}

export interface PlatformStats {
  totalCampaigns: number; totalDonations: number; totalAmount: number; totalDonors: number;
  categoryBreakdown: { category: string; uangTotal: number; barangQty: number; count: number }[]
  typeBreakdown: { type: string; total: number; count: number }[]
  recentDonations: Donation[]
  selectedMonth?: string
}

// ============================================================
// CONSTANTS & HELPERS
// ============================================================
export const ADMIN_WHATSAPP = '6281234567890'
export const CATEGORIES = ['Bencana', 'Ramadhan', 'Sosial', 'Donasi Rutin']

export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

export const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

// Helper parse images JSON string → array
export const parseImages = (images?: string): string[] => {
  if (!images) return []
  try { return JSON.parse(images) } catch { return images ? [images] : [] }
}

export const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'Bencana':      return 'bg-red-100 text-red-700 border-red-200'
    case 'Ramadhan':     return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Sosial':       return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Donasi Rutin': return 'bg-green-100 text-green-700 border-green-200'
    default:             return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const formatUniqueCode = (code: number): string =>
  String(code).padStart(3, '0')

export const calculateTransferAmount = (baseAmount: number, uniqueCode: number): number =>
  baseAmount + uniqueCode

export const PROPOSAL_CRITERIA = [
  { key: 'kejelasanTujuan',   label: 'Kejelasan Tujuan & Dampak', description: 'Sejauh mana tujuan proposal jelas, terukur, dan memberikan dampak nyata bagi penerima manfaat.' },
  { key: 'kelayakanAnggaran', label: 'Kelayakan Anggaran',        description: 'Apakah rincian anggaran realistis, transparan, dan proporsional dengan output yang dijanjikan.' },
  { key: 'urgensi',           label: 'Tingkat Urgensi',           description: 'Seberapa mendesak kebutuhan tersebut dan apakah ada batas waktu pelaksanaan yang kritis.' },
  { key: 'keterkaitanKampus', label: 'Keterkaitan Kampus',        description: 'Sejauh mana proposal mendukung kegiatan atau civitas akademika Polines.' },
  { key: 'kontribusiSosial',  label: 'Kontribusi Sosial',         description: 'Besar dampak sosial yang dihasilkan bagi komunitas sekitar kampus dan masyarakat luas.' },
] as const

export const getCriteriaScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500 text-white'
  if (score >= 60) return 'bg-amber-500 text-white'
  return 'bg-red-500 text-white'
}

export const getAverageCriteria = (proposal: Proposal): number => {
  const scores = [
    proposal.kejelasanTujuan   ?? 0,
    proposal.kelayakanAnggaran ?? 0,
    proposal.urgensi           ?? 0,
    proposal.keterkaitanKampus ?? 0,
    proposal.kontribusiSosial  ?? 0,
  ]
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export const isProposalEligible = (proposal: Proposal): boolean =>
  getAverageCriteria(proposal) >= 70

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':  return 'bg-green-100 text-green-700'
    case 'rejected':  return 'bg-red-100 text-red-700'
    case 'pending':   return 'bg-yellow-100 text-yellow-700'
    case 'active':    return 'bg-teal-100 text-teal-700'
    case 'closed':    return 'bg-gray-100 text-gray-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    default:          return 'bg-gray-100 text-gray-700'
  }
}

// ── Proposal Score ─────────────────────────────────────────
export interface ProposalScoreBreakdown {
  dataPengaju: number
  kejelasanJudul: number
  kualitasDeskripsi: number
  kewajaranTarget: number
  kelengkapanLokasi: number
  fotoBukti: number
  suratResmi: number
  total: number
  isEligible: boolean
}

export function calculateProposalScore(proposal: {
  proposerEmail?: string | null
  proposerPhone?: string | null
  proposerAddress?: string | null
  proposer?: { name?: string | null } | null
  title?: string | null
  description?: string | null
  targetAmount?: number | null
  startDate?: string | null
  endDate?: string | null
  campaignLocation?: string | null
  photoUrls?: string | string[] | null
  officialDocUrl?: string | null
}): ProposalScoreBreakdown {

  // 1. Kelengkapan Data Pengaju (15)
  const filled = [
    proposal.proposer?.name,
    proposal.proposerEmail,
    proposal.proposerPhone,
    proposal.proposerAddress,
  ].filter(Boolean).length
  const dataPengaju = filled === 4 ? 15 : filled === 3 ? 8 : 0

  // 2. Kejelasan Judul (10)
  const judul = (proposal.title || '').trim()
  const kejelasanJudul = judul.length >= 20 ? 10 : judul.length >= 10 ? 5 : 0

  // 3. Kualitas Deskripsi (20)
  const desc = (proposal.description || '').trim()
  const kualitasDeskripsi = desc.length >= 300 ? 20
    : desc.length >= 200 ? 15
    : desc.length >= 100 ? 8
    : 0

  // 4. Kewajaran Target vs Durasi (20)
  const target = Number(proposal.targetAmount || 0)
  let kewajaranTarget = 0
  if (target > 0 && proposal.startDate && proposal.endDate) {
    const durasi = Math.round(
      (new Date(proposal.endDate).getTime() - new Date(proposal.startDate).getTime())
      / (1000 * 60 * 60 * 24)
    )
    const durasiOk = durasi >= 7 && durasi <= 90
    if (durasiOk && target <= 100_000_000)      kewajaranTarget = 20
    else if (durasiOk && target <= 500_000_000) kewajaranTarget = 12
    else                                         kewajaranTarget = 5
  }

  // 5. Kelengkapan Lokasi (10)
  const lokasi = (proposal.campaignLocation || '').trim()
  const kelengkapanLokasi = lokasi.length >= 10 ? 10 : lokasi.length > 0 ? 5 : 0

  // 6. Foto Bukti (10)
  const photos = proposal.photoUrls
    ? (Array.isArray(proposal.photoUrls)
        ? proposal.photoUrls
        : (() => { try { return JSON.parse(proposal.photoUrls as string) } catch { return [] } })())
    : []
  const fotoBukti = photos.length > 0 ? 10 : 0

  // 7. Surat Resmi (15) — hard requirement
  const suratResmi = proposal.officialDocUrl ? 15 : 0

  const total = dataPengaju + kejelasanJudul + kualitasDeskripsi
    + kewajaranTarget + kelengkapanLokasi + fotoBukti + suratResmi

  return {
    dataPengaju, kejelasanJudul, kualitasDeskripsi,
    kewajaranTarget, kelengkapanLokasi, fotoBukti, suratResmi,
    total,
    isEligible: total >= 70 && suratResmi > 0,
  }
}