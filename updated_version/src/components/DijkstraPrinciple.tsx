import { Card } from "./ui";
import styles from "./DijkstraPrinciple.module.css";

export function DijkstraPrinciple() {
  return (
    <Card className={styles.card}>
      <section
        aria-labelledby="dijkstra-principle-title"
        className={styles.section}
      >
        <p className={styles.eyebrow}>The key idea</p>
        <h2 id="dijkstra-principle-title" className={styles.title}>
          Why Dijkstra works
        </h2>
        <p>
          Dijkstra keeps a <strong>tentative distance</strong>: the shortest
          route found so far from the start. It always chooses the unvisited
          vertex with the smallest tentative distance.
        </p>

        <div className={styles.invariant}>
          <strong>The invariant</strong>
          <p>
            When that vertex is chosen, its distance is final. Any alternative
            route would have to pass through another unvisited vertex that is at
            least as far away, then add non-negative edge weights. That route
            cannot be shorter.
          </p>
        </div>

        <div className={styles.example}>
          <h3>Example: choose the smallest total distance</h3>
          <p>
            After visiting A, B has distance 4 and D has distance 2. Visit D
            next, not B. The route A-D-B costs 2 + 1 = 3, so B improves from 4
            to 3.
          </p>
        </div>

        <p className={styles.warning}>
          <strong>Not the smallest edge:</strong> compare total distances from
          the start, not just one edge. Dijkstra also requires non-negative edge
          weights; a negative edge could make a visited distance smaller later
          and break the rule that it is final.
        </p>
      </section>
    </Card>
  );
}
