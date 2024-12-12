'use client'

import Dashboard from '@/components/Dashboard'

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-6">주문 통계</h2>
        <Dashboard />
      </div>
    </div>
  )
}
