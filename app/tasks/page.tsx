import { Suspense } from 'react'
import TasksPageClient from './page-client'

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageClient />
    </Suspense>
  )
}
