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
  images?: string        // JSON array string: '["url1","url2"]'
  location?: string
  dropOffLocation?: string  // alamat tujuan pengiriman barang donasi
  status: string
  isUrgent: boolean
  isPublic: boolean
  uniqueCode: number
  createdBy: string
  creator?: { name: string }
  _count?: { donations: number }
  paymentMethods?: PaymentMethod[]
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
  status: string            // 'pending' | 'approved' | 'rejected'
  createdAt: string
  rejectionReason?: string
  // Data pengaju
  proposer?: { name: string; email?: string; phone?: string; address?: string }
  proposerEmail?: string
  proposerPhone?: string
  proposerAddress?: string
  // Detail campaign yang diajukan
  startDate?: string
  endDate?: string
  campaignLocation?: string
  photoUrl?: string
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
  categoryBreakdown: { category: string; total: number; count: number }[]
  typeBreakdown: { type: string; total: number; count: number }[]
  recentDonations: Donation[]
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