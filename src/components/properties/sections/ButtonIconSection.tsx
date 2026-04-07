import { BUTTON_ICONS } from '@utils/buttonIcons'
import type { ButtonShape } from '@model/shapes'
import styles from '../PropertiesPanel.module.css'

interface Props {
  icon: ButtonShape['icon']
  onChange: (icon: ButtonShape['icon']) => void
}

export function ButtonIconSection({ icon, onChange }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Icon</div>

      <div className={styles.iconSideRow}>
        <label className={styles.iconSideLabel}>
          <input
            type="radio"
            name="iconSide"
            value="left"
            checked={icon?.side === 'left'}
            onChange={() => onChange(icon ? { ...icon, side: 'left' } : { name: BUTTON_ICONS[0].name, side: 'left' })}
          />
          Left
        </label>
        <label className={styles.iconSideLabel}>
          <input
            type="radio"
            name="iconSide"
            value="right"
            checked={icon?.side === 'right'}
            onChange={() => onChange(icon ? { ...icon, side: 'right' } : { name: BUTTON_ICONS[0].name, side: 'right' })}
          />
          Right
        </label>
        <button
          className={styles.iconClearBtn}
          onClick={() => onChange(null)}
          disabled={!icon}
          title="Remove icon"
        >
          None
        </button>
      </div>

      <div className={styles.iconGrid}>
        {BUTTON_ICONS.map(({ name, label, Icon }) => (
          <button
            key={name}
            title={label}
            className={`${styles.iconGridItem} ${icon?.name === name ? styles.iconGridItemActive : ''}`}
            onClick={() => onChange({ name, side: icon?.side ?? 'left' })}
          >
            <Icon size={16} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  )
}
