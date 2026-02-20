import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <FileQuestion className="mb-6 h-16 w-16 text-text-tertiary" strokeWidth={1.5} />
      <h1 className="font-heading text-2xl font-bold text-text-primary">Stránka nenalezena</h1>
      <p className="mt-2 max-w-sm text-text-secondary">
        Požadovaná stránka neexistuje nebo byla přesunuta.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button>Zpět na hlavní stránku</Button>
        </Link>
      </div>
    </div>
  )
}
