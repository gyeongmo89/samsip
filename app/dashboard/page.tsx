'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') === 'true' : false

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return null
  }

  return (
    // <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl px-2 py-2">
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 backdrop-blur-sm rounded-lg shadow-xl px-2 py-2">
      {/* <select
        className="mb-4 p-2 rounded-md bg-white text-gray-800"
        onChange={(e) => {
          // Handle month selection here
          console.log('Selected month:', e.target.value);
        }}
      >
        {[...Array(12)].map((_, i) => (
          <option key={i} value={i + 1}>
            {`${i + 1}월`}
          </option>
        ))}
      </select>
       */}
      <Dashboard />
    </div>
  )
}
