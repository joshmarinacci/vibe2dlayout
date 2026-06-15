import React, {createContext, useContext, useEffect, useMemo, useReducer} from 'react'
import {canRedo, canUndo, createInitialHistory, historyReducer} from './history'
import {initialState} from './reducer'
import type {AppAction, AppState} from './types'
import {loadLibrary} from '@utils/libraryStorage'
import {appLogger} from '@logging'

interface AppStateContextValue {
    state: AppState
    canUndo: boolean
    canRedo: boolean
}
export interface PropsheetState {
    isOpen(name:string):boolean
    setOpen(name: string, open: any): void;
    dump(): void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null)
const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null)
const PropsheetStateContext = createContext<PropsheetState | null>(null)

class PropsheetStateImpl implements PropsheetState {
    states:Record<string,boolean>
    constructor() {
        this.states = {}
    }

    dump(): void {
        appLogger.debug('Propsheet state dump', {states: this.states})
    }
    setOpen(name: string, open: boolean): void {
        this.states[name] = open
    }
    isOpen(name: string): boolean {
        if(name in this.states) {
            return this.states[name]
        } else {
            return false
        }
    }

}

export function AppProvider({children}: { children: React.ReactNode }) {
    const [history, dispatch] = useReducer(
        historyReducer,
        initialState,
        createInitialHistory,
    )

    useEffect(() => {
        loadLibrary().then(library => dispatch({type: 'LOAD_LIBRARY', library}))
    }, [])

    const contextValue = useMemo<AppStateContextValue>(() => ({
        state: history.present,
        canUndo: canUndo(history),
        canRedo: canRedo(history),
    }), [history])

    const propsheetState = useMemo<PropsheetState>(() => new PropsheetStateImpl(),[])

    return (
        <AppStateContext.Provider value={contextValue}>
            <AppDispatchContext.Provider value={dispatch}>
                <PropsheetStateContext.Provider value={propsheetState}>
                    {children}
                </PropsheetStateContext.Provider>
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    )
}

export function useAppState(): AppStateContextValue {
    const ctx = useContext(AppStateContext)
    if (!ctx) throw new Error('useAppState must be used within AppProvider')
    return ctx
}

export function useAppDispatch(): React.Dispatch<AppAction> {
    const ctx = useContext(AppDispatchContext)
    if (!ctx) throw new Error('useAppDispatch must be used within AppProvider')
    return ctx
}

export function usePropsheetState(): PropsheetState {
    const ctx = useContext(PropsheetStateContext)
    if (!ctx) throw new Error('usePropsheetState must be used within AppProvider')
    return ctx
}
