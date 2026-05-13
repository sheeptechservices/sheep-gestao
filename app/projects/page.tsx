import { Suspense } from 'react'
import ProjectsPageClient from './page-client'

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageClient />
    </Suspense>
  )
}
