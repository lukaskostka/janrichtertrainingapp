'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Dumbbell, LayoutList } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Tabs } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StaggerList, StaggerItem } from '@/components/ui/motion'
import { ExerciseCard } from '@/components/exercises/exercise-card'
import { ExerciseForm } from '@/components/exercises/exercise-form'
import { TemplateCard } from '@/components/templates/template-card'
import { getExercises } from '@/lib/actions/exercises'
import { getTemplates } from '@/lib/actions/templates'
import type { Exercise, WorkoutTemplate } from '@/types'
import Link from 'next/link'

const TABS = [
  { id: 'exercises', label: 'Cviky' },
  { id: 'templates', label: 'Šablony' },
]

export default function ExercisesPage() {
  const [activeTab, setActiveTab] = useState('exercises')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formDirty, setFormDirty] = useState(false)
  const [confirmCloseForm, setConfirmCloseForm] = useState(false)

  const loadExercises = useCallback(async (searchQuery: string) => {
    try {
      setError(null)
      const data = await getExercises(searchQuery || undefined)
      setExercises(data)
    } catch {
      setExercises([])
      setError('Nepodařilo se načíst cviky.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      setError(null)
      const data = await getTemplates()
      setTemplates(data)
    } catch {
      setTemplates([])
      setError('Nepodařilo se načíst šablony.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    if (activeTab === 'exercises') {
      const timeout = setTimeout(() => {
        loadExercises(search)
      }, 300)
      return () => clearTimeout(timeout)
    } else {
      loadTemplates()
    }
  }, [search, activeTab, loadExercises, loadTemplates])

  function handleEdit(exercise: Exercise) {
    setEditingExercise(exercise)
    setShowForm(true)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingExercise(null)
    setFormDirty(false)
    loadExercises(search)
  }

  function handleCloseForm() {
    if (formDirty) {
      setConfirmCloseForm(true)
      return
    }
    setShowForm(false)
    setEditingExercise(null)
    setFormDirty(false)
  }

  return (
    <AppShell>
      <PageHeader
        title="Cviky & Šablony"
        rightAction={
          activeTab === 'exercises' ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Cvik
            </Button>
          ) : (
            <Link href="/templates/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Šablona
              </Button>
            </Link>
          )
        }
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setSearch(''); setLoading(true); setError(null) }} />

      <div className="space-y-4 px-4 pt-4">
        {error && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setLoading(true)
                  if (activeTab === 'exercises') {
                    loadExercises(search)
                  } else {
                    loadTemplates()
                  }
                }}
              >
                Zkusit znovu
              </Button>
            </div>
          </div>
        )}
        {activeTab === 'exercises' && (
          <>
            <SearchInput
              placeholder="Hledat cvik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
              <Loading className="py-12" />
            ) : exercises.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title={search ? 'Žádné cviky nenalezeny' : 'Žádné cviky'}
                description={search ? 'Zkuste jiný výraz' : 'Začněte přidáním prvního cviku do knihovny.'}
                action={
                  !search && (
                    <Button size="sm" onClick={() => setShowForm(true)}>
                      Přidat cvik
                    </Button>
                  )
                }
              />
            ) : (
              <StaggerList className="space-y-2">
                {exercises.map((exercise) => (
                  <StaggerItem key={exercise.id}>
                    <ExerciseCard
                      exercise={exercise}
                      onEdit={handleEdit}
                    />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </>
        )}

        {activeTab === 'templates' && (
          <>
            {loading ? (
              <Loading className="py-12" />
            ) : templates.length === 0 ? (
              <EmptyState
                icon={LayoutList}
                title="Žádné šablony"
                description="Vytvořte si šablonu tréninku pro rychlejší plánování."
                action={
                  <Link href="/templates/new">
                    <Button size="sm">Vytvořit šablonu</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomSheet
        isOpen={showForm}
        onClose={handleCloseForm}
        onCloseRequest={handleCloseForm}
        title={editingExercise ? 'Upravit cvik' : 'Nový cvik'}
      >
        <ExerciseForm
          exercise={editingExercise}
          onSuccess={handleFormSuccess}
          onDirtyChange={setFormDirty}
        />
      </BottomSheet>
      <ConfirmDialog
        isOpen={confirmCloseForm}
        onClose={() => setConfirmCloseForm(false)}
        onConfirm={() => {
          setConfirmCloseForm(false)
          setShowForm(false)
          setEditingExercise(null)
          setFormDirty(false)
        }}
        title="Zahodit změny?"
        description="Máte rozpracovaný cvik. Opravdu ho chcete zavřít?"
        confirmLabel="Zahodit"
        variant="danger"
      />
    </AppShell>
  )
}
