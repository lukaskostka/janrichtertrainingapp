import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Card } from '@/components/ui/card'
import { ProfileForm } from '@/components/settings/profile-form'
import { IcsSection } from '@/components/settings/ics-section'
import { SignOutButton } from '@/components/settings/sign-out-button'
import { GeminiStatus } from '@/components/settings/gemini-status'
import { getTrainerProfile } from '@/lib/actions/settings'

export default async function SettingsPage() {
  const trainer = await getTrainerProfile()

  return (
    <AppShell>
      <PageHeader title="Nastavení" />
      <PageTransition>
      <div className="space-y-6 px-4 pb-6">
        {/* Profile Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Profil
          </h2>
          <Card className="p-4">
            <ProfileForm trainer={trainer} />
          </Card>
        </section>

        {/* ICS Calendar Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Kalendář
          </h2>
          <IcsSection icsToken={trainer.ics_token} />
        </section>

        {/* Gemini OCR Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            OCR Rozpoznávání
          </h2>
          <GeminiStatus />
        </section>

        {/* Sign Out Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Odhlášení
          </h2>
          <Card className="p-4">
            <SignOutButton />
          </Card>
        </section>
      </div>
      </PageTransition>
    </AppShell>
  )
}
