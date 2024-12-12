'use client'

import { useState, useEffect } from 'react'
import { FileDown, Plus, Search } from 'lucide-react'
import Modal from '@/components/Modal'

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    managerName: '',
    contact: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8000/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data)
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
          manager_name: formData.managerName,
          contact: formData.contact
        }),
      })

      if (!response.ok) throw new Error('Failed to create supplier')
      
      alert('공급업체가 등록되었습니다.')
      fetchSuppliers()
      setIsModalOpen(false)
      setFormData({ name: '', managerName: '', contact: '' })
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('공급업체 등록 중 오류가 발생했습니다.')
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
            <h2 className="text-2xl font-bold text-gray-800">공급업체 관리</h2>
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
              
              {/* 공급업체 등록 버튼 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus />
                공급업체 등록
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

          {/* 공급업체 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구입처명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{supplier.manager_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{supplier.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 공급업체 등록 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="공급업체 등록">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              구입처명 <span className="text-red-500">*</span>
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
              담당자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contact}
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
