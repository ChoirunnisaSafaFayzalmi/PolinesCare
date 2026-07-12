'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AppNotification } from '@/components/polines/types'
import { formatDate } from '@/components/polines/types'

interface NotifikasiTabProps {
  notifications: AppNotification[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  // ⬅ FIX: prop baru — dipanggil saat notifikasi yang punya relatedType +
  // relatedId diklik, supaya admin langsung diarahkan ke detail item terkait
  // (donasi/proposal), bukan cuma menandai notifikasi sebagai "dibaca".
  onNavigate?: (relatedType: string, relatedId: string) => void
}

export function NotifikasiTab({ notifications, unreadCount, onMarkRead, onMarkAllRead, onNavigate }: NotifikasiTabProps) {
  // ⬅ FIX: sebelumnya klik notifikasi hanya memanggil onMarkRead(n.id).
  // Sekarang, kalau notifikasi ini punya relatedType & relatedId (dibuat oleh
  // backend saat ada donasi/proposal baru — lihat donations/route.ts dan
  // proposals/route.ts), klik juga memicu onNavigate supaya admin langsung
  // diarahkan ke detail item yang dimaksud. Notifikasi lama/generik tanpa
  // relatedType (misal notifikasi bawaan seed) tetap cuma menandai "dibaca"
  // seperti biasa — tidak ada navigasi yang dipaksakan kalau tidak ada target.
  const handleClick = (n: AppNotification) => {
    onMarkRead(n.id)
    if (n.relatedType && n.relatedId && onNavigate) {
      onNavigate(n.relatedType, n.relatedId)
    }
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Notifikasi ({notifications.length})</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="rounded-lg text-sm" onClick={onMarkAllRead}>
            Tandai semua dibaca
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada notifikasi</p>
        ) : (
          <div className="space-y-2 max-h-150 overflow-y-auto">
            {notifications.map(n => {
              const isClickable = Boolean(n.relatedType && n.relatedId)
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    !n.isRead
                      ? 'bg-teal-50/50 border-teal-100 hover:bg-teal-50'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                  title={isClickable ? 'Klik untuk lihat detail' : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{n.type}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}