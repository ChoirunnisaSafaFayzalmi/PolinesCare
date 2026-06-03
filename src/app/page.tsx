import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/polines/landing-page'
import { Header } from '@/components/polines/header'
import { Footer } from '@/components/polines/footer'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    if (session.user.role === 'admin') redirect('/admin/dashboard')
    redirect('/dashboard')
  }

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