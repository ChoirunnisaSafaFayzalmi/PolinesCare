'use client'

import React from 'react'
import { Separator } from '@/components/ui/separator'
import {
  Heart, AlertTriangle, Star, Users, HandHeart,
  Mail, Phone, Globe, MapPin,
} from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">Polines Care</span>
            </div>
            <p className="text-teal-200 text-sm leading-relaxed">
              Platform donasi kampus Politeknik Negeri Semarang untuk menggalang kepedulian dan dana bantuan sosial, bencana, serta kegiatan keagamaan.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Kategori Donasi</h4>
            <ul className="space-y-2 text-teal-200 text-sm">
              <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"><AlertTriangle className="h-3 w-3" /> Bencana Alam</li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"><Star className="h-3 w-3" /> Kegiatan Ramadhan</li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"><Users className="h-3 w-3" /> Kegiatan Sosial</li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"><HandHeart className="h-3 w-3" /> Donasi Rutin</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hubungi Kami</h4>
            <ul className="space-y-2 text-teal-200 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> polinescare@polines.ac.id</li>
              <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> (024) 123-4567</li>
              <li className="flex items-center gap-2"><Globe className="h-3 w-3" /> care.polines.ac.id</li>
              <li className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Semarang, Jawa Tengah</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-teal-700" />
        <div className="text-center text-teal-300 text-sm">
          &copy; {new Date().getFullYear()} Polines Care &mdash; Politeknik Negeri Semarang. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  )
}
