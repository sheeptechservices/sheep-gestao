import { redirect } from 'next/navigation'

// /projects/new is no longer a standalone page — project creation
// is handled via the drawer on /projects. Redirect permanently.
export default function ProjectsNewPage() {
  redirect('/projects')
}
