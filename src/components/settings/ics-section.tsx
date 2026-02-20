'use client'

import { useState } from 'react'
import { Copy, Check, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { regenerateIcsToken } from '@/lib/actions/ics'

interface IcsSectionProps {
  icsToken: string
}

export function IcsSection({ icsToken }: IcsSectionProps) {
  const [copied, setCopied] = useState(false)
  const [currentToken, setCurrentToken] = useState(icsToken)
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webcalUrl = `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/ics/${currentToken}`
  const httpsUrl = `${baseUrl}/api/ics/${currentToken}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webcalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      try {
        await navigator.clipboard.writeText(httpsUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard not available
      }
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const newToken = await regenerateIcsToken()
      if (newToken) setCurrentToken(newToken)
      setShowRegenerate(false)
    } catch {
      // Error handled silently
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
        <h3 className="font-medium text-text-primary">ICS Kalendář</h3>
      </div>
      <p className="mb-3 text-sm text-text-secondary">
        Přidejte tuto URL do Apple Calendar nebo jiné kalendářové aplikace pro automatickou synchronizaci tréninků.
      </p>
      <div className="mb-3 rounded-lg border border-border bg-elevated px-3 py-2">
        <p className="break-all text-xs text-text-secondary">{webcalUrl}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopy}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" strokeWidth={1.5} />
            Zkopírováno
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" strokeWidth={1.5} />
            Zkopírovat URL
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowRegenerate(true)}
        className="ml-2 gap-2"
      >
        Vygenerovat nový odkaz
      </Button>
      <div className="mt-4 rounded-lg border border-border bg-bg px-3 py-2.5">
        <p className="text-xs font-medium text-text-secondary">Přidání do iPhone:</p>
        <ol className="mt-1.5 list-inside list-decimal space-y-0.5 text-xs text-text-secondary">
          <li>Zkopírujte URL výše</li>
          <li>Otevřete Nastavení &gt; Kalendář &gt; Účty</li>
          <li>Přidat účet &gt; Jiný &gt; Přidat odběr kalendáře</li>
          <li>Vložte zkopírovanou URL a potvrďte</li>
        </ol>
      </div>
      <ConfirmDialog
        isOpen={showRegenerate}
        onClose={() => setShowRegenerate(false)}
        onConfirm={handleRegenerate}
        title="Vygenerovat nový odkaz?"
        description="Starý kalendářový odkaz přestane fungovat. Budete muset aktualizovat URL v kalendářové aplikaci."
        confirmLabel="Vygenerovat"
        variant="danger"
        loading={regenerating}
      />
    </Card>
  )
}
