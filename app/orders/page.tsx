'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/OrderModal'
import { FileDown, Plus, Search } from 'lucide-react'

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleSearch = () => {
    const filteredOrders = orders.filter(order => 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setOrders(filteredOrders)
    if (!searchTerm) {
      fetchOrders()
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sortedOrders = [...orders].sort((a, b) => {
      let aValue = key.includes('.') ? key.split('.').reduce((obj, k) => obj[k], a) : a[key]
      let bValue = key.includes('.') ? key.split('.').reduce((obj, k) => obj[k], b) : b[key]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setOrders(sortedOrders)
  }

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">주문 현황</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="검색어를 입력하세요"
                  className="px-6 py-3 border rounded-lg text-black w-80 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleSearch}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
              
              {/* 주문등록 버튼 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-6 h-6" />
                주문등록
              </button>
              
              {/* 엑셀 다운로드 버튼 */}
              <button
                onClick={handleExportCSV}
                className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <FileDown className="w-6 h-6" />
                엑셀 다운로드
              </button>
            </div>
          </div>

          {/* 주문 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    주문일자 {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공급업체</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단위</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">합계</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대금 지급주기</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.unit.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.payment_cycle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.client}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{order.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 주문 등록 모달 */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderComplete={fetchOrders}
      />
    </div>
  )
}
