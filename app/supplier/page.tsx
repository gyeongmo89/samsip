'use client'

import { useState, useEffect } from 'react'
import { FileDown, Plus, Search, Minus } from 'lucide-react'
import Modal from '@/components/Modal'

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: ''
  })
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8000/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      // 최신 데이터가 위로 오도록 정렬
      const sortedData = [...data].sort((a, b) => b.id - a.id)
      setSuppliers(sortedData)
      setFilteredSuppliers(sortedData)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          address: formData.address
        }),
      })

      if (!response.ok) throw new Error('Failed to create supplier')
      
      alert('구입처가 등록되었습니다.')
      fetchSuppliers()
      setIsModalOpen(false)
      setFormData({ name: '', contact: '', address: '' })
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('구입처 등록 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      (supplier.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.contact?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked)
    if (e.target.checked) {
      setSelectedSuppliers(filteredSuppliers.map((_, index) => index.toString()))
    } else {
      setSelectedSuppliers([])
    }
  }

  const handleSelectSupplier = (index: string) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      alert('삭제할 구입처를 선택해주세요.')
      return
    }

    const confirmed = confirm('선택한 구입처를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const supplierIds = selectedSuppliers.map(index => parseInt(filteredSuppliers[parseInt(index)].id))
      const response = await fetch('http://localhost:8000/suppliers/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierIds),
      })

      if (response.ok) {
        fetchSuppliers()
        setSelectedSuppliers([])
        setSelectAll(false)
        alert('선택한 구입처가 삭제되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.detail || '구입처 삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting suppliers:', error)
      alert('구입처 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">구입처 관리</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(e.target.value)}
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
              
              {/* 구입처 등록/삭제 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  구입처 등록
                </button>
                <button
                  onClick={handleDeleteSuppliers}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  구입처 삭제
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

          {/* 구입처 목록 테이블 */}
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
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">구입처명</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">연락처</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier, index) => (
                  <tr 
                    key={supplier.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectSupplier(index.toString())}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.includes(index.toString())}
                        onChange={() => handleSelectSupplier(index.toString())}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{supplier.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-black">{supplier.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 구입처 등록 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="구입처 등록">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구입처명 <span className="text-red-500">*</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length <= 11) {
                  if (value.length > 7) {
                    value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
                  } else if (value.length > 3) {
                    value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2')
                  }
                  setFormData({ ...formData, contact: value })
                }
              }}
              placeholder="010-0000-0000"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비고
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
    </div>
  )
}
