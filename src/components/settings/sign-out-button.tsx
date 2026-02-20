'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setShowConfirm(true)}
        className="w-full gap-2"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Odhlásit se
      </Button>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSignOut}
        title="Odhlásit se?"
        description="Opravdu se chcete odhlásit z aplikace?"
        confirmLabel="Odhlásit"
        cancelLabel="Zrušit"
        variant="danger"
        loading={loading}
      />
    </>
  )
}
