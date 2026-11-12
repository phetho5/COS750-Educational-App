import { Card } from './ui'
import styles from './ShortestPathsInPractice.module.css'

const applications = [
  {
    title: 'Navigation',
    vertices: 'Intersections or places',
    edges: 'Roads',
    weight: 'Travel time or distance',
  },
  {
    title: 'Delivery planning',
    vertices: 'Warehouses and destinations',
    edges: 'Road connections',
    weight: 'Distance, time or fuel cost',
  },
  {
    title: 'Computer networks',
    vertices: 'Routers',
    edges: 'Network links',
    weight: 'Delay or transmission cost',
  },
] as const

export function ShortestPathsInPractice() {
  return (
    <Card className={styles.card}>
      <section aria-labelledby="shortest-paths-practice-title" className={styles.section}>
        <p className={styles.eyebrow}>Why this matters</p>
        <h2 id="shortest-paths-practice-title" className={styles.title}>
          Where shortest paths show up
        </h2>
        <p className={styles.intro}>
          The graph stays the same idea. Choose what its vertices, edges and weights represent to match the problem.
        </p>
        <ul className={styles.applications}>
          {applications.map((application) => (
            <li key={application.title} className={styles.application}>
              <h3>{application.title}</h3>
              <p><strong>Vertices:</strong> {application.vertices}</p>
              <p><strong>Edges:</strong> {application.edges}</p>
              <p><strong>Weight:</strong> {application.weight}</p>
            </li>
          ))}
        </ul>
        <p className={styles.takeaway}>
          <strong>Choose weights to match your goal.</strong> The quickest route minimises travel time; the shortest route by distance minimises kilometres.
        </p>
      </section>
    </Card>
  )
}
