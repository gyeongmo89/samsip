'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { FileDown, Plus, Search, Minus } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useData } from '@/contexts/DataContext'

export default function UnitList() {
  interface Unit {
    id: number;
    name: string;
    description: string;
    // Add other unit properties here if needed
  }

  const [units, setUnits] = useState<Unit[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const { lastUpdate } = useData()

  useEffect(() => {
    fetchUnits()
  }, [lastUpdate])

  const fetchUnits = async () => {
    try {
      const response = await fetch('http://localhost:8000/units')
      if (!response.ok) throw new Error('Failed to fetch units')
      const data = await response.json()
      // 최신 데이터가 위로 오도록 정렬
      const sortedData = [...data].sort((a, b) => b.id - a.id)
      setUnits(sortedData)
      setFilteredUnits(sortedData)
    } catch (error) {
      console.error('Error fetching units:', error)
      alert('단위 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || ""
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.detail === 'already_exists') {
          alert('이미 등록된 단위입니다.')
          return
        }
        throw new Error(data.detail || 'Failed to create unit')
      }

      alert('단위가 등록되었습니다.')
      fetchUnits()
      setIsModalOpen(false)
      setFormData({ name: '', description: '' })
    } catch (error) {
      console.error('Error creating unit:', error)
      alert('단위 등록 중 오류가 발생했습니다.')
    }
  }

  const handleEditClick = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name || '',
      description: unit.description || ''
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      if (!editingUnit) return

      const response = await fetch(`http://localhost:8000/units/${editingUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || ""
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.detail === 'already_exists') {
          alert('이미 등록된 단위입니다.')
          return
        }
        throw new Error(data.detail || 'Failed to update unit')
      }

      alert('단위가 수정되었습니다.')
      fetchUnits()
      setIsEditModalOpen(false)
      setEditingUnit(null)
      setFormData({ name: '', description: '' })
    } catch (error) {
      console.error('Error updating unit:', error)
      alert('단위 수정 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    const filtered = units.filter(unit =>
      (unit.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setFilteredUnits(filtered)
  }, [units, searchTerm])

  const handleExcelDownload = () => {
    const excelData = units.map(unit => ({
      '단위': unit.name,
      '비고': unit.description
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const columnWidths = [
      { wch: 20 }, // 단위
      { wch: 40 }, // 비고
    ]
    ws['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(wb, ws, '단위 목록')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `단위목록_${today}.xlsx`)

    alert('엑셀 다운로드 완료')
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked)
    if (e.target.checked) {
      setSelectedUnits(filteredUnits.map((_, index) => index.toString()))
    } else {
      setSelectedUnits([])
    }
  }

  const handleSelectUnit = (index: string) => {
    setSelectedUnits(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleDeleteUnits = async () => {
    if (selectedUnits.length === 0) {
      alert('삭제할 단위를 선택해주세요.')
      return
    }

    const confirmed = confirm('선택한 단위를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const unitIds = selectedUnits.map(index => filteredUnits[parseInt(index)].id.toString())
      const response = await fetch('http://localhost:8000/units/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitIds),
      })

      if (response.ok) {
        fetchUnits()
        setSelectedUnits([])
        setSelectAll(false)
        alert('선택한 단위가 삭제되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.detail || '단위 삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting units:', error)
      alert('단위 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">단위 관리</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              
              {/* 단위 등록/삭제 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(true)
                    setFormData({ name: '', description: '' })
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  단위 등록
                </button>
                <button
                  onClick={handleDeleteUnits}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  단위 삭제
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

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">단위</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">비고</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUnits.map((unit, index) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(index.toString())}
                        onChange={() => handleSelectUnit(index.toString())}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-black">{unit.name}</td>
                    <td className="px-6 py-4 text-center text-black">{unit.description}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditClick(unit)}
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

      {/* 등록 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFormData({ name: '', description: '' })
        }}
        title="단위 등록"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-black font-medium mb-1">
                단위 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border rounded-lg text-black w-full text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-black font-medium mb-1">비고</label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-4 py-2 border rounded-lg text-black w-full text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setFormData({ name: '', description: '' })
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
          setFormData({ name: '', description: '' })
          setEditingUnit(null)
        }}
        title="단위 수정"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-black font-medium mb-1">
                단위 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border rounded-lg text-black w-full text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-black font-medium mb-1">비고</label>
              <input
                type="text"
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-4 py-2 border rounded-lg text-black w-full text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false)
                setFormData({ name: '', description: '' })
                setEditingUnit(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
