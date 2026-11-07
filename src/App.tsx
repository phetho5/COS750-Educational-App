import { useCurrentPath } from './routing/router'

/*
  Placeholder app shell from step 1 (project setup).
  The real screens are added in step 5 and replace this.
*/
export default function App() {
  const path = useCurrentPath()

  return (
    <main style={{ maxWidth: 'var(--content-width)', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-display)', lineHeight: 1.15 }}>Graphs and the shortest path</h1>
      <p style={{ color: 'var(--color-muted)' }}>The COS212 app is being built. You are on {path}.</p>
    </main>
  )
}
