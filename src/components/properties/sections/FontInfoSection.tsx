import type { Dispatch } from 'react'
import type { CustomFont } from '@model/document'
import type { AppAction } from '@store/types'
import styles from '../PropertiesPanel.module.css'

interface Props {
  font: CustomFont
  dispatch: Dispatch<AppAction>
}

export function FontInfoSection({ font, dispatch }: Props) {
  const variableLabel =
    font.isVariable === null ? 'Detecting…' :
    font.isVariable ? 'Variable font' :
    'Static font'

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Font</div>
        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span className={styles.value} style={{ fontFamily: font.name, fontSize: 14 }}>
            {font.name}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Type</span>
          <span className={styles.value}>{variableLabel}</span>
        </div>
      </div>

      {font.isVariable === true && font.axes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Variable Axes</div>
          {font.axes.map(axis => (
            <div key={axis.tag} className={styles.row}>
              <span className={styles.label} style={{ fontFamily: 'ui-monospace, monospace' }}>
                {axis.tag}
              </span>
              <span className={styles.value}>
                {axis.min} – {axis.default} – {axis.max}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.row}>
          <button
            className={styles.actionBtn}
            style={{ color: '#c00', borderColor: '#c00' }}
            onClick={() => dispatch({ type: 'DELETE_CUSTOM_FONT', fontName: font.name })}
          >
            Remove Font
          </button>
        </div>
      </div>
    </>
  )
}
