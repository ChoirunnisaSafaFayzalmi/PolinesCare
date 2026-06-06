'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES } from '@/components/polines/types'
import type { Campaign } from '@/components/polines/types'

const inputCls = 'rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'

interface CampaignFormViewProps {
  campaignForm: {
    organizerName: string; organizerEmail: string; organizerPhone: string; organizerAddress: string
    title: string; description: string; category: string; targetAmount: string
    startDate: string; endDate: string; isUrgent: boolean
    paymentMethod: string; accountNumber: string; uniqueCode: string
  }
  setCampaignForm: (form: any) => void
  editingCampaign: Campaign | null
  submitting: boolean
  onSave: () => void
  onBack: () => void
}

export function CampaignFormView({
  campaignForm, setCampaignForm, editingCampaign, submitting, onSave, onBack,
}: CampaignFormViewProps) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          {editingCampaign ? 'Edit Campaign' : 'Campaign Baru'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg" onClick={onBack}>
            Kembali
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2.5"
            onClick={onSave}
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Section 1: Informasi Pribadi */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Informasi Pribadi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nama', key: 'organizerName', type: 'text' },
              { label: 'Email', key: 'organizerEmail', type: 'email' },
              { label: 'No Telp', key: 'organizerPhone', type: 'text' },
              { label: 'Alamat', key: 'organizerAddress', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{label}</Label>
                <Input
                  type={type}
                  value={(campaignForm as any)[key]}
                  onChange={(e) => setCampaignForm({ ...campaignForm, [key]: e.target.value })}
                  placeholder="Ketik di sini"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Informasi Campaign */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Informasi Campaign</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Judul</Label>
              <Input
                value={campaignForm.title}
                onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
              <Textarea
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                placeholder="Ketik di sini"
                rows={5}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Kategori</Label>
              <Select value={campaignForm.category} onValueChange={(v) => setCampaignForm({ ...campaignForm, category: v })}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Target Dana</Label>
              <Input
                type="number"
                value={campaignForm.targetAmount}
                onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Mendesak</Label>
              <button
                type="button"
                onClick={() => setCampaignForm({ ...campaignForm, isUrgent: !campaignForm.isUrgent })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  campaignForm.isUrgent ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  campaignForm.isUrgent ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Pembayaran */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Pembayaran</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Metode Pembayaran</Label>
              <Select value={campaignForm.paymentMethod} onValueChange={(v) => setCampaignForm({ ...campaignForm, paymentMethod: v })}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_bni">Transfer Bank BNI</SelectItem>
                  <SelectItem value="transfer_mandiri">Transfer Bank Mandiri</SelectItem>
                  <SelectItem value="ewallet_gopay">E-Wallet GoPay</SelectItem>
                  <SelectItem value="ewallet_ovo">E-Wallet OVO</SelectItem>
                  <SelectItem value="ewallet_dana">E-Wallet DANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">No Rekening / No Transfer</Label>
              <Input
                value={campaignForm.accountNumber}
                onChange={(e) => setCampaignForm({ ...campaignForm, accountNumber: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Kode Unik Transfer (3 digit)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={campaignForm.uniqueCode}
                  onChange={(e) => setCampaignForm({ ...campaignForm, uniqueCode: e.target.value })}
                  placeholder="000"
                  className={`${inputCls} w-32`}
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Kode unik 3 digit untuk identifikasi transfer. Contoh: kode{' '}
                  <span className="font-semibold text-violet-600">010</span>, donasi 200.000 → transfer{' '}
                  <span className="font-semibold text-violet-600">200.010</span>
                </p>
              </div>
            </div>
          </div>
        </section>

      </CardContent>
    </Card>
  )
}