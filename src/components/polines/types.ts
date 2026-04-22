// ============================================================
// TYPES
// ============================================================
export interface User {
  id: string; email: string; name: string; role: string; phone?: string; avatar?: string;
}
export interface Campaign {
  id: string; title: string; description: string; category: string; targetAmount: number;
  collectedAmount: number; startDate: string; endDate: string; image?: string;
  status: string; isUrgent: boolean; createdBy: string; creator?: { name: string };
  _count?: { donations: number };
}
export interface Donation {
  id: string; campaignId: string; userId: string; amount: number; donorName: string;
  donorEmail: string; donorPhone: string; type: string; paymentMethod: string;
  proofUrl?: string; status: string; message?: string; createdAt: string;
  campaign?: { title: string; category: string };
}
export interface Proposal {
  id: string; title: string; description: string; category: string;
  targetAmount?: number; proposedBy: string; votesCount: number; status: string;
  createdAt: string; proposer?: { name: string };
}
export interface AppNotification {
  id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string;
}
export interface RecommendedCampaign extends Campaign {
  score?: number;
  reason?: string;
  matchPercentage?: number;
}
export interface FundUsage {
  id: string; campaignId: string; description: string; amount: number;
  date: string; documentUrl?: string; campaign?: { title: string };
}
export interface PlatformStats {
  totalCampaigns: number; totalDonations: number; totalAmount: number; totalDonors: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
  typeBreakdown: { type: string; total: number; count: number }[];
  recentDonations: Donation[];
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

export const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'Bencana': return 'bg-red-100 text-red-700 border-red-200'
    case 'Ramadhan': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Sosial': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Donasi Rutin': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'active': return 'bg-teal-100 text-teal-700'
    case 'closed': return 'bg-gray-100 text-gray-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
