import React, { createContext, useContext, useReducer, useMemo } from 'react'
import type { AppState, AppAction } from './types'
import { historyReducer, createInitialHistory, canUndo, canRedo } from './history'
import { initialState } from './reducer'

interface AppStateContextValue {
  state: AppState
  canUndo: boolean
  canRedo: boolean
}

const AppStateContext = createContext<AppStateContextValue | null>(null)
const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [history, dispatch] = useReducer(
    historyReducer,
    initialState,
    createInitialHistory,
  )

  const contextValue = useMemo<AppStateContextValue>(() => ({
    state: history.present,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
  }), [history])

  return (
    <AppStateContext.Provider value={contextValue}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
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
