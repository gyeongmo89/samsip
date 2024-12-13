'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import Select from 'react-select'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderComplete: () => void
}

const defaultFormData = {
  supplier_id: '',
  item_id: '',
  unit_id: '',
  quantity: '',
  price: '',
  total: '',
  payment_cycle: '',
  payment_method: '계좌이체',
  client: '',
  notes: '',
  date: new Date().toISOString().split('T')[0]
}

export default function OrderModal({ isOpen, onClose, onOrderComplete }: OrderModalProps) {
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])
  const [formData, setFormData] = useState(defaultFormData)
  const [showDaySelect, setShowDaySelect] = useState(false)

  const paymentMethods = ['계좌이체', '현금', '카드결제']
  const paymentCycles = ['선택해주세요', '매월초', '매월중순', '매월말', '기타입력']

  const formatNumber = (value: string | undefined | null) => {
    if (!value) return ''
    const number = value.toString().replace(/[^\d]/g, '')
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleInputChange = (field: string, value: string) => {
    if (['quantity', 'price', 'total'].includes(field)) {
      const numericValue = value.replace(/[^\d]/g, '')
      setFormData(prev => ({ ...prev, [field]: numericValue || '' }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData)
      setShowDaySelect(false)
      localStorage.removeItem('lastOrder')
    }
  }, [isOpen])

  useEffect(() => {
    fetchSuppliers()
    fetchItems()
    fetchUnits()
  }, [])

  useEffect(() => {
    if (isOpen) {
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}')
      if (Object.keys(lastOrder).length > 0) {
        setFormData(lastOrder)
      }
    }
  }, [isOpen])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8000/suppliers/')
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items/')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await fetch('http://localhost:8000/units/')
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {    
      const response = await fetch('http://localhost:8000/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          supplier_id: parseInt(formData.supplier_id),
          item_id: parseInt(formData.item_id),
          unit_id: parseInt(formData.unit_id),
          price: parseInt(formData.price.replace(/[^\d]/g, '')),
          quantity: parseInt(formData.quantity.replace(/[^\d]/g, '')),
          total: parseInt(formData.total.replace(/[^\d]/g, '')),
          payment_cycle: formData.payment_cycle,
          payment_method: formData.payment_method,
          client: formData.client,
          notes: formData.notes,
          date: formData.date
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '발주 등록 실패')
      }

      const result = await response.json()
      onClose()
      onOrderComplete()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('발주 등록 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류가 발생했습니다'))
    }
  }

  useEffect(() => {
    if (formData.price && formData.quantity) {
      const price = parseInt(formData.price.replace(/[^\d]/g, '') || '0')
      const quantity = parseInt(formData.quantity.replace(/[^\d]/g, '') || '0')
      const calculatedTotal = price * quantity
      setFormData(prev => ({ ...prev, total: calculatedTotal.toString() }))
    } else {
      setFormData(prev => ({ ...prev, total: '' }))
    }
  }, [formData.price, formData.quantity])

  const handlePaymentCycleChange = (value: string) => {
    if (value === '기타입력') {
      setShowDaySelect(true)
      setFormData(prev => ({ ...prev, payment_cycle: '1' }))
    } else {
      setShowDaySelect(false)
      setFormData(prev => ({ ...prev, payment_cycle: value }))
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      if (value.length > 7) {
        value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2')
      }
      setFormData(prev => ({ ...prev, client: value }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="발주 등록">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 구입처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              구입처 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => handleInputChange('supplier_id', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* 품목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              품목 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => {
                const selectedItemId = e.target.value
                const item = items.find(i => i.id === parseInt(selectedItemId))
                if (item) {
                  setFormData(prev => ({
                    ...prev,
                    item_id: selectedItemId,
                    price: item.price ? item.price.toString() : ''
                  }))
                }
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* 단위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              단위 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit_id}
              onChange={(e) => handleInputChange('unit_id', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(formData.quantity) || ''}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 단가 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              단가 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(formData.price) || ''}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 총액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              총액 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(formData.total) || ''}
              onChange={(e) => handleInputChange('total', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
              readOnly
            />
          </div>

          {/* 결제주기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              결제주기 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_cycle === '' ? '선택해주세요' : 
                     showDaySelect ? '기타입력' : formData.payment_cycle}
              onChange={(e) => handlePaymentCycleChange(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              {paymentCycles.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
            {showDaySelect && (
              <Select
                value={{ value: formData.payment_cycle, label: `${formData.payment_cycle}일` }}
                onChange={(option) => {
                  if (option) {
                    setFormData(prev => ({ ...prev, payment_cycle: option.value }))
                  }
                }}
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: `${i + 1}일`
                }))}
                className="mt-2 text-black"
                classNamePrefix="select"
                placeholder="날짜 선택"
                isSearchable
              />
            )}
          </div>

          {/* 대금지급방법 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              대금지급방법 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => handleInputChange('payment_method', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* 발주일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              발주일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 구입 연락처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              구입 연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={handlePhoneNumberChange}
              placeholder="010-0000-0000"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 비고 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              비고
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            등록
          </button>
        </div>
      </form>
    </Modal>
  )
}
