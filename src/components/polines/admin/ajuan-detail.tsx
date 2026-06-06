'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Proposal } from '@/components/polines/types'
import {
  formatRupiah, getCategoryColor, getStatusColor,
  PROPOSAL_CRITERIA, getAverageCriteria, isProposalEligible, getCriteriaScoreColor,
} from '@/components/polines/types'

interface AjuanDetailViewProps {
  proposal: Proposal
  onSaveCriteria: (id: string, criteria: Record<string, number>) => void
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void
}

export function AjuanDetailView({ proposal: initialProposal, onSaveCriteria, onUpdateStatus }: AjuanDetailViewProps) {
  const [proposal, setProposal] = useState(initialProposal)
  const [scores, setScores] = useState<Record<string, number>>({
    kejelasanTujuan: initialProposal.kejelasanTujuan ?? 0,
    kelayakanAnggaran: initialProposal.kelayakanAnggaran ?? 0,
    urgensi: initialProposal.urgensi ?? 0,
    keterkaitanKampus: initialProposal.keterkaitanKampus ?? 0,
    kontribusiSosial: initialProposal.kontribusiSosial ?? 0,
  })

  const effectiveProposal = { ...proposal, ...scores } as Proposal
  const avgScore = getAverageCriteria(effectiveProposal)
  const eligible = isProposalEligible(effectiveProposal)

  const handleSave = () => {
    onSaveCriteria(proposal.id, scores)
    setProposal({ ...proposal, ...scores } as Proposal)
  }

  const handleUpdateStatus = (status: 'approved' | 'rejected') => {
    handleSave()
    onUpdateStatus(proposal.id, status)
    setProposal({ ...proposal, status })
  }

  return (
    <div className="space-y-6">
      {/* Proposal Info */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{proposal.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <Badge variant="outline" className={getCategoryColor(proposal.category)}>{proposal.category}</Badge>
                  <span className="ml-2">Diajukan oleh:{' '}
                    <span className="font-medium text-gray-700">{proposal.proposer?.name ?? 'Anonim'}</span>
                  </span>
                </p>
              </div>
              <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
            </div>
            <Separator />
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
            {proposal.targetAmount && (
              <>
                <Separator />
                <div className="flex items-start">
                  <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Target Dana</span>
                  <span className="text-sm font-medium text-gray-900">{formatRupiah(proposal.targetAmount)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-start">
              <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Jumlah Suara</span>
              <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <ThumbsUp className="h-3.5 w-3.5" /> {proposal.votesCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <div>
              <CardTitle className="text-base font-bold">Alur Penilaian Proposal</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Proposal dinilai berdasarkan 5 kriteria (skor 0–100). Rata-rata ≥ 70 memenuhi syarat.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {PROPOSAL_CRITERIA.map(criterion => {
            const score = scores[criterion.key] ?? 0
            return (
              <div key={criterion.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{criterion.label}</Label>
                    <p className="text-xs text-gray-400 mt-0.5">{criterion.description}</p>
                  </div>
                  <span className={`inline-flex items-center justify-center w-12 h-7 rounded-md text-sm font-bold ${getCriteriaScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">0</span>
                  <input
                    type="range" min={0} max={100} step={5} value={score}
                    onChange={(e) => setScores(prev => ({ ...prev, [criterion.key]: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <span className="text-xs text-gray-400 w-8">100</span>
                </div>
              </div>
            )
          })}

          {/* Score Summary */}
          <div className={`mt-4 p-4 rounded-lg border-2 ${eligible ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Rata-rata Skor</p>
                <p className="text-2xl font-bold mt-1">
                  <span className={eligible ? 'text-emerald-600' : 'text-red-600'}>{avgScore}</span>
                  <span className="text-sm text-gray-400 ml-2">/ 100</span>
                </p>
              </div>
              <div className="text-right">
                <Badge className={`text-sm px-3 py-1 ${eligible ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {eligible ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI SYARAT'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {eligible ? 'Proposal dapat disetujui' : 'Rata-rata skor harus ≥ 70'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" /> Simpan Penilaian
            </Button>
            {proposal.status === 'pending' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  disabled={!eligible}
                  title={eligible ? 'Setujui proposal' : 'Skor rata-rata harus ≥ 70'}
                  onClick={() => handleUpdateStatus('approved')}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> Setujui
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  onClick={() => handleUpdateStatus('rejected')}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" /> Tolak
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}