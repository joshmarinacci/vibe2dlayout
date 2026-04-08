import { useAppState } from '@store/context'
import styles from './StatusBar.module.css'

interface Props {
  leftCollapsed: boolean
  rightCollapsed: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
}

export function StatusBar({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }: Props) {
  const { state } = useAppState()
  const { ids } = state.selection

  let label = ''
  if (ids.length === 1) {
    const shape = state.document.shapes[ids[0]]
    label = shape?.name ?? shape?.type ?? ''
  } else if (ids.length > 1) {
    label = `${ids.length} shapes selected`
  }

  return (
    <div className={styles.statusBar}>
      <button
        className={styles.toggleBtn}
        onClick={onToggleLeft}
        title={leftCollapsed ? 'Show layer panel' : 'Hide layer panel'}
      >
        {leftCollapsed ? '›' : '‹'}
      </button>

      <span className={styles.label}>{label}</span>

      <button
        className={styles.toggleBtn}
        onClick={onToggleRight}
        title={rightCollapsed ? 'Show properties panel' : 'Hide properties panel'}
      >
        {rightCollapsed ? '‹' : '›'}
      </button>
    </div>
  )
}
