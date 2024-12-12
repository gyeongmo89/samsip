'use client'

import { useState, useEffect } from 'react'
import { FileDown, Plus, Search } from 'lucide-react'
import Modal from '@/components/Modal'

export default function ItemList() {
  const [items, setItems] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: `단가: ${formData.price}원`
        }),
      })

      if (!response.ok) throw new Error('Failed to create item')
      
      alert('품목이 등록되었습니다.')
      fetchItems()
      setIsModalOpen(false)
      setFormData({ name: '', price: '' })
    } catch (error) {
      console.error('Error creating item:', error)
      alert('품목 등록 중 오류가 발생했습니다.')
    }
  }

  const handleSearch = () => {
    // TODO: Implement search functionality
  }

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">품목 관리</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Search />
                </button>
              </div>
              
              {/* 품목 등록 버튼 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus />
                품목 등록
              </button>
              
              {/* 엑셀 다운로드 버튼 */}
              <button
                onClick={handleExportCSV}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <FileDown />
                엑셀 다운로드
              </button>
            </div>
          </div>

          {/* 품목 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가금액</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.description ? item.description.replace('단가: ', '').replace('원', '') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 품목 등록 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="품목 등록">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              품목명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              단가금액 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              등록
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
