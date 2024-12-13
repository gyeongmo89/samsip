'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/OrderModal'
import { FileDown, FileUp, Plus, Search } from 'lucide-react'

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
    setFilteredOrders(
      orders.filter((order) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          (order.supplier?.name || '').toLowerCase().includes(searchLower) ||
          (order.item?.name || '').toLowerCase().includes(searchLower) ||
          (order.client || '').toLowerCase().includes(searchLower)
        )
      })
    )
  }, [orders, searchTerm])

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/orders', {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data)
      setFilteredOrders(data)
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
      const orderIds = selectedOrders.map(index => parseInt(filteredOrders[parseInt(index)].id))
      const response = await fetch('http://localhost:8000/orders/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderIds),
      })

      if (response.ok) {
        fetchOrders()
        setSelectedOrders([])
        setSelectAll(false)
        alert('선택한 주문이 삭제되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.detail || '주문 삭제 실패')
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
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">발주현황</h2>
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
              
              {/* 발주등록 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  발주등록
                </button>
                <button
                  onClick={handleDeleteOrders}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  발주삭제
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
              <button
                // onClick={() => document.getElementById('excelUpload').click()}
                onClick={() => alert('엑셀 업로드 기능 준비중')}
                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg"
              >
                
                <FileUp className="w-6 h-6" />
                엑셀 업로드
              </button>
              {/* <input
                id="excelUpload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                style={{ display: 'none' }}
              /> */}

            </div>
          </div>

          {/* 발주 목록 테이블 */}
          <div className="overflow-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">발주일</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">구입처</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">품목</th>                  
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">단가</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">단위</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">수량</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">총액</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">결제주기</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">대금지급방법</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">구입 연락처</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider min-w-[200px]">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(index.toString())}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(index.toString())}
                        onChange={() => handleSelectOrder(index.toString())}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">
                      {order.date ? new Date(order.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/\. /g, '-').slice(0, -1) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.item.name}</td>                    
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.unit.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.payment_cycle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.payment_method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{order.client}</td>
                    <td className="px-6 py-4 text-center text-black break-words min-w-[200px]">{order.notes}</td>
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
