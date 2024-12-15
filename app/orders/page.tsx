'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/OrderModal'
import { FileDown, FileUp, Minus, Plus, Search } from 'lucide-react'
import * as XLSX from 'xlsx'

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
        if (response.status === 404) {
          setOrders([])
          setFilteredOrders([])
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch orders')
      }
      
      const data = await response.json()
      // 최신 데이터가 위로 오도록 정렬
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })
      setOrders(sortedData)
      setFilteredOrders(sortedData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      setFilteredOrders([])
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

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      if (key === 'date') {
        const dateA = new Date(a[key])
        const dateB = new Date(b[key])
        return direction === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime()
      }

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

    setFilteredOrders(sortedOrders)
  }

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  }

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked)
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map((_, index) => index.toString()))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (index) => {
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

  const handleRowClick = (index) => {
    handleSelectOrder(index)
  }

  const handleExcelDownload = () => {
    const excelData = orders.map(order => ({
      '발주일': order.date,
      '구입처': order.supplier.name,
      '품목': order.item.name,
      '단가': order.price,
      '단위': order.unit.name,
      '수량': order.quantity,
      '총액': order.total,
      '결제주기': order.payment_cycle,
      '대금지급방법': order.payment_method,
      '구입연락처': order.client,
      '비고': order.notes
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const columnWidths = [
      { wch: 12 }, // 발주일
      { wch: 15 }, // 구입처
      { wch: 20 }, // 품목
      { wch: 10 }, // 단가
      { wch: 8 },  // 단위
      { wch: 8 },  // 수량
      { wch: 12 }, // 총액
      { wch: 12 }, // 결제주기
      { wch: 15 }, // 대금지급방법
      { wch: 15 }, // 구입연락처
      { wch: 30 }, // 비고
    ]
    ws['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(wb, ws, '발주 목록')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `발주목록_${today}.xlsx`)

    alert('엑셀 다운로드 완료')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/orders/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('엑셀 파일이 성공적으로 업로드되었습니다.')
        // 목록 새로고침
        fetchOrders()
      } else {
        const error = await response.json()
        alert(`업로드 실패: ${error.detail}`)
      }
    } catch (error) {
      alert('업로드 중 오류가 발생했습니다.')
      console.error('Upload error:', error)
    }
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
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                   <Plus className="w-4 h-4" />
                  발주등록
                </button>
                <button
                  onClick={handleDeleteOrders}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  발주삭제
                </button>
              </div>
              
              {/* 엑셀 다운로드 버튼 */}
              <button
                onClick={handleExcelDownload}
                className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <FileDown className="w-6 h-6" />
                엑셀 다운로드
              </button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg">
                  <FileUp className="w-6 h-6" />
                  엑셀 업로드
                </div>
              </label>
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
                  <th 
                    className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    발주일
                    {sortConfig.key === 'date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
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
