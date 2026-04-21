import type { Dispatch } from 'react'
import type { TextStyleDef } from '@model/textStyle'
import type { AppAction } from '@store/types'
import { generateId } from '@utils/idgen'
import { StyleRow } from './StyleRow'
import styles from './StylesSection.module.css'

interface Props {
  textStyles: TextStyleDef[]
  selectedStyleId: string | null
  dispatch: Dispatch<AppAction>
}

export function StylesSection({ textStyles, selectedStyleId, dispatch }: Props) {
  const addStyle = () => {
    const style: TextStyleDef = { id: generateId(), name: 'New Style' }
    dispatch({ type: 'ADD_TEXT_STYLE', style })
    dispatch({ type: 'SELECT_STYLE', styleId: style.id })
  }

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.label}>Styles</span>
        <button className={styles.addBtn} onClick={addStyle} title="Add text style">+</button>
      </div>
      {textStyles.map((style, i) => (
        <StyleRow
          key={style.id}
          style={style}
          isSelected={style.id === selectedStyleId}
          isFirst={i === 0}
          isLast={i === textStyles.length - 1}
          dispatch={dispatch}
        />
      ))}
    </div>
  )
}
