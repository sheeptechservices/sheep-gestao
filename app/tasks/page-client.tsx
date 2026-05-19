'use client'
import { useSearchParams } from 'next/navigation'
import { PageNav } from '@/components/layout/PageNav'
import { WeeklyBoard } from '@/components/tasks/WeeklyBoard'
import { ProjectsView } from '@/components/projects/ProjectsView'
import { LeadsView } from '@/components/tasks/LeadsView'

const TASKS_TABS = [
  { label: 'Semana',     tab: ''           },
  { label: 'Checkpoint', tab: 'checkpoint' },
  { label: 'Leads',      tab: 'leads'      },
]

export default function TasksPage() {
  const params = useSearchParams()
  const tab    = params.get('tab') ?? ''

  return (
    <>
      <PageNav tabs={TASKS_TABS} basePath="/tasks" />
      {tab === '' && <WeeklyBoard />}
      {tab === 'checkpoint' && <ProjectsView />}
      {tab === 'leads' && <LeadsView />}
    </>
  )
}
