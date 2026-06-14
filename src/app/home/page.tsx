import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LandingPage } from '@/components/polines/landing-page'
import { Header } from '@/components/polines/header'
import { Footer } from '@/components/polines/footer'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  // Tidak redirect, biarkan siapapun akses
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <LandingPage />
      </main>
      <Footer />
    </div>
  )
}