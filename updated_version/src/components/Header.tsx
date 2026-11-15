/* The shared header: course navigation and an accessible visual theme toggle. */
import { useEffect, useState } from 'react'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { Icon } from './Icon'
import styles from './Header.module.css'

type Theme = 'dark' | 'light'
const THEME_KEY = 'cos750-color-theme'

function getInitialTheme(): Theme {
  // index.html sets this before React loads, avoiding a flash of the wrong theme.
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function Header() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The toggle still works when storage is blocked or unavailable.
    }
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <button type="button" className={styles.home} onClick={() => navigate(paths.map)} aria-label="COS212 home: module map">
        <span className={styles.logo} aria-hidden="true"><span /></span>
        <span className={styles.name}>COS212</span>
      </button>
      <button
        type="button"
        className={`${styles.themeToggle} ${theme === 'dark' ? styles.dark : styles.light}`}
        onClick={() => setTheme(nextTheme)}
        role="switch"
        aria-checked={theme === 'dark'}
        aria-label="Dark mode"
        title={`Switch to ${nextTheme} mode`}
      >
        <span className={styles.themeTrack} aria-hidden="true">
          <span className={`${styles.trackIcon} ${styles.trackSun}`}>
            <Icon name="sun" size={25} strokeWidth={1.9} />
          </span>
          <span className={`${styles.trackIcon} ${styles.trackMoon}`}>
            <Icon name="moon" size={25} strokeWidth={1.9} />
          </span>
          <span className={styles.themeThumb}>
            <span className={`${styles.thumbIcon} ${styles.thumbSun}`}>
              <Icon name="sun" size={32} strokeWidth={2.5} />
            </span>
            <span className={`${styles.thumbIcon} ${styles.thumbMoon}`}>
              <Icon name="moon" size={32} strokeWidth={2.5} />
            </span>
          </span>
        </span>
      </button>
    </header>
  )
}
