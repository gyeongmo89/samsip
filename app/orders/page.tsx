'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/OrderModal'
import { FileDown, Plus, Search } from 'lucide-react'

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [filteredOrders, setFilteredOrders] = useState([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = [...orders]

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm])

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked)
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map((_, index) => index.toString()))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (index: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('삭제할 주문을 선택해주세요.')
      return
    }

    const confirmed = confirm('선택한 주문을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const orderIds = selectedOrders.map(index => filteredOrders[parseInt(index)].id)
      const response = await fetch('http://localhost:8000/orders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_ids: orderIds }),
      })

      if (response.ok) {
        fetchOrders()
        setSelectedOrders([])
        setSelectAll(false)
      } else {
        throw new Error('주문 삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting orders:', error)
      alert('주문 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleRowClick = (index: string) => {
    handleSelectOrder(index)
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
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  주문등록
                </button>
                <button
                  onClick={handleDeleteOrders}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  주문삭제
                </button>
              </div>
              
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
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">주문일자</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">거래처</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">품목</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">단위</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">단가</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">수량</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">총액</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">결제주기</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">거래처</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(index.toString())}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(index.toString())}
                        onChange={() => handleSelectOrder(index.toString())}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
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
