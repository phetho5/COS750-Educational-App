/* Shown for any URL the app doesn't know, with a way back to the map. */
import { notFoundText as t } from '../content/welcomeText'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { Button } from '../components/ui'
import ui from '../components/ui.module.css'

export function NotFoundScreen() {
  return (
    <div className={ui.page}>
      <h1 className={ui.pageTitle}>{t.title}</h1>
      <p className={ui.lead}>{t.body}</p>
      <div className={ui.row}>
        <Button iconAfter="arrowRight" onClick={() => navigate(paths.map)}>
          {t.back}
        </Button>
      </div>
    </div>
  )
}
