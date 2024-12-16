'use client'

import { useState, useEffect } from 'react'
import { FileDown, Plus, Search, Minus } from 'lucide-react'
import Modal from '@/components/Modal'
import * as XLSX from 'xlsx'
import { useData } from '@/contexts/DataContext'

interface Item {
  id: number;
  name: string;
  price: number;
  description: string;
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const { lastUpdate } = useData()

  useEffect(() => {
    fetchItems()
  }, [lastUpdate])

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      const sortedData = [...data].sort((a, b) => b.id - a.id)
      setItems(sortedData)
      setFilteredItems(sortedData)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price.replace(/,/g, '')),
          description: formData.description
        }),
      })

      if (!response.ok) throw new Error('Failed to create item')
      
      alert('품목이 등록되었습니다.')
      fetchItems()
      setIsModalOpen(false)
      setFormData({ name: '', price: '', description: '' })
    } catch (error) {
      console.error('Error creating item:', error)
      alert('품목 등록 중 오류가 발생했습니다.')
    }
  }

  const handleEditClick = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price?.toLocaleString(),  
      description: item.description
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      if (!editingItem) return

      const response = await fetch(`http://localhost:8000/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price.replace(/,/g, '')),
          description: formData.description
        }),
      })

      if (!response.ok) throw new Error('Failed to update item')

      alert('품목이 수정되었습니다.')
      fetchItems()
      setIsEditModalOpen(false)
      setEditingItem(null)
      setFormData({ name: '', price: '', description: '' })
    } catch (error) {
      console.error('Error updating item:', error)
      alert('품목 수정 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    const filtered = items.filter(item =>
      (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [items, searchTerm])

  const handleExcelDownload = () => {
    const excelData = items.map(item => ({
      '품목': item.name,
      '가격': item.price,
      '설명': item.description
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const columnWidths = [
      { wch: 20 }, // 품목
      { wch: 12 }, // 가격
      { wch: 40 }, // 설명
    ]
    ws['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(wb, ws, '품목 목록')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `품목목록_${today}.xlsx`)

    alert('엑셀 다운로드 완료')
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked)
    if (e.target.checked) {
      setSelectedItems(filteredItems.map((_, index) => index.toString()))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (index: string) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleDeleteItems = async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 품목을 선택해주세요.')
      return
    }

    const confirmed = confirm('선택한 품목을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const itemIds = selectedItems.map(index => filteredItems[Number(index)].id)
      const response = await fetch('http://localhost:8000/items/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemIds),
      })

      if (response.ok) {
        fetchItems()
        setSelectedItems([])
        setSelectAll(false)
        alert('선택한 품목이 삭제되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.detail || '품목 삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting items:', error)
      alert('품목 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">품목 관리</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="px-6 py-3 border rounded-lg text-black w-80 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={() => {}}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
              
              {/* 품목 등록/삭제 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  품목 등록
                </button>
                <button
                  onClick={handleDeleteItems}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  품목 삭제
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
            </div>
          </div>

          {/* 품목 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">품목명</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">단가</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">비고</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">수정</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectItem(index.toString())}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(index.toString())}
                        onChange={() => handleSelectItem(index.toString())}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{item.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{item.description}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        수정
                      </button>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-black font-medium mb-2">
              품목명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-2">
              단가 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '')
                if (value) {
                  const numValue = parseInt(value)
                  setFormData({ ...formData, price: numValue.toLocaleString() })
                } else {
                  setFormData({ ...formData, price: '' })
                }
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-2">
              비고
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              등록
            </button>
          </div>
        </form>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setFormData({ name: '', price: '', description: '' })
          setEditingItem(null)
        }}
        title="품목 수정"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-black font-medium mb-2">
                품목명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>
            <div>
              <label className="block text-black font-medium mb-2">
                단가 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '')
                  if (value) {
                    const numValue = parseInt(value)
                    setFormData({ ...formData, price: numValue.toLocaleString() })
                  } else {
                    setFormData({ ...formData, price: '' })
                  }
                }}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-black font-medium mb-2">
                비고
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false)
                setFormData({ name: '', price: '', description: '' })
                setEditingItem(null)
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              수정 완료
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
