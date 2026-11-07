/* The bar at the top of every page. The logo takes the student to the module map. */
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <button type="button" className={styles.home} onClick={() => navigate(paths.map)} aria-label="COS212 home: module map">
        <span className={styles.logo} aria-hidden="true">
          <span />
        </span>
        <span className={styles.name}>COS212</span>
      </button>
    </header>
  )
}
