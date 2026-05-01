import type {Variable, VariableType} from '@model/variable'
import type {AppAction} from '@store/types'
import {generateId} from '@utils/idgen'
import {type Dispatch, useState} from 'react'
import styles from './StylesSection.module.css'
import {VariableRow} from './VariableRow'

interface Props {
    variables: Variable[]
    selectedVariableId: string | null
    dispatch: Dispatch<AppAction>
}

const TYPE_DEFAULTS: Record<VariableType, Variable['value']> = {
    number: 0,
    string: '',
    boolean: false,
    color: '#000000',
}

export function VariablesSection({variables, selectedVariableId, dispatch}: Props) {
    const [showTypeMenu, setShowTypeMenu] = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    const addVariable = (type: VariableType) => {
        const count = variables.filter(v => v.type === type).length
        const typeName = type.charAt(0).toUpperCase() + type.slice(1)
        const name = count === 0 ? typeName : `${typeName} ${count + 1}`
        const variable: Variable = {id: generateId(), name, type, value: TYPE_DEFAULTS[type]}
        dispatch({type: 'ADD_VARIABLE', variable})
        dispatch({type: 'SELECT_VARIABLE', variableId: variable.id})
        setShowTypeMenu(false)
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span
                        className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Variables</span>
                </div>
                <div style={{position: 'relative'}}>
                    <button
                        className={styles.addBtn}
                        onClick={() => setShowTypeMenu(v => !v)}
                        title="Add variable"
                    >+
                    </button>
                    {showTypeMenu && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            minWidth: 100,
                        }}>
                            {(['number', 'string', 'boolean', 'color'] as VariableType[]).map(type => (
                                <button
                                    key={type}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '5px 12px',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    onClick={() => addVariable(type)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {!collapsed && variables.map((variable, i) => (
                <VariableRow
                    key={variable.id}
                    variable={variable}
                    isSelected={variable.id === selectedVariableId}
                    isFirst={i === 0}
                    isLast={i === variables.length - 1}
                    dispatch={dispatch}
                />
            ))}
        </div>
    )
}
