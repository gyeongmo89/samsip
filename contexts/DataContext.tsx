'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface DataContextType {
  refreshData: () => void
  lastUpdate: number
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const refreshData = () => {
    setLastUpdate(Date.now())
  }

  return (
    <DataContext.Provider value={{ refreshData, lastUpdate }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
