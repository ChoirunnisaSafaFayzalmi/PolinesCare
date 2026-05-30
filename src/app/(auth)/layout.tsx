import { Header } from '@/components/polines/header'
import { Footer } from '@/components/polines/footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}