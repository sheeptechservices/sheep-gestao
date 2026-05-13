/**
 * Garante que .next existe dentro do projeto e está marcado como
 * System + Hidden para que o OneDrive o ignore completamente.
 *
 * OneDrive não sincroniza pastas/arquivos com o atributo SYSTEM (S).
 * Assim .next fica no projeto (resolução de módulos ok) e o OneDrive
 * não cria reparse points que quebram o readlink do Next.js.
 */
import { execSync }      from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path              from 'path'

const nextDir = path.join(process.cwd(), '.next')

// Remove junction antiga se existir (rmdir sem /S não apaga conteúdo de junction)
try {
  const { execSync: ex } = await import('child_process')
  // Detecta se é junction: fsutil reparsepoint query retorna algo se for reparse point
  const out = ex(`fsutil reparsepoint query "${nextDir}" 2>nul`, { shell: 'cmd.exe', encoding: 'utf8' })
  if (out.includes('Reparse')) {
    execSync(`rmdir "${nextDir}"`, { shell: 'cmd.exe' })
    console.log('✓ Junction antiga removida')
  }
} catch { /* não era junction, ok */ }

// Garante que .next existe como pasta real
if (!existsSync(nextDir)) {
  mkdirSync(nextDir, { recursive: true })
  console.log('✓ Pasta .next criada')
}

// Marca como System + Hidden → OneDrive ignora
try {
  execSync(`attrib +S +H "${nextDir}"`, { shell: 'cmd.exe' })
  console.log('✓ .next marcado como System+Hidden — OneDrive não vai sincronizar')
} catch (e) {
  console.warn('⚠ Não foi possível marcar .next:', e.message)
}
