'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'

interface TabRiwayatProps {
  userDonations: Donation[]
}

export function TabRiwayat({ userDonations }: TabRiwayatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Donasi ({userDonations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {userDonations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada riwayat donasi</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead className="hidden md:table-cell">Metode</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDonations.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {d.campaign?.title}
                    </TableCell>
                    <TableCell className="font-semibold text-teal-600">
                      {formatRupiah(d.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{d.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}