'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderComplete: () => void
}

export default function OrderModal({ isOpen, onClose, onOrderComplete }: OrderModalProps) {
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])
  const [formData, setFormData] = useState({
    supplier_id: '',
    item_id: '',
    unit_id: '',
    price: '',
    quantity: '',
    total: '',
    payment_cycle: '',
    date: new Date().toISOString().split('T')[0],
    client: '',
    notes: ''
  })

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
      const response = await fetch('http://localhost:8000/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

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

  const fetchUnits = async () => {
    try {
      const response = await fetch('http://localhost:8000/units')
      if (!response.ok) throw new Error('Failed to fetch units')
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Convert string values to appropriate types before sending
      const orderData = {
        supplier_id: parseInt(formData.supplier_id),
        item_id: parseInt(formData.item_id),
        unit_id: parseInt(formData.unit_id),
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        total: parseFloat(formData.total),
        payment_cycle: formData.payment_cycle,
        client: formData.client,
        notes: formData.notes || ''
      }

      const response = await fetch('http://localhost:8000/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        localStorage.setItem('lastOrder', JSON.stringify(formData))
        onClose()
        window.dispatchEvent(new Event('ordersUpdated'))
      } else {
        throw new Error('주문 등록 실패')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('주문 등록 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const calculateTotal = () => {
    const price = parseFloat(formData.price) || 0
    const quantity = parseFloat(formData.quantity) || 0
    setFormData(prev => ({ ...prev, total: (price * quantity).toString() }))
  }

  useEffect(() => {
    calculateTotal()
  }, [formData.price, formData.quantity])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="주문 등록">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 공급업체 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              공급업체 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
            >
              <option value="">선택하세요</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
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
              onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
            >
              <option value="">선택하세요</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
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
              onChange={(e) => setFormData(prev => ({ ...prev, unit_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
            >
              <option value="">선택하세요</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          {/* 단가 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              단가 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
              min="0"
            />
          </div>

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
              min="0"
            />
          </div>

          {/* 합계 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              합계 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.total}
              readOnly
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
            />
          </div>

          {/* 대금 지급주기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              대금 지급주기 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_cycle}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_cycle: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
            >
              <option value="">선택하세요</option>
              <option value="weekly">주단위</option>
              <option value="monthly">월단위</option>
              <option value="quarterly">분기단위</option>
            </select>
          </div>

          {/* 주문일자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              주문일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
              required
            />
          </div>

          {/* 거래처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              거래처 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg h-12"
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
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
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
  )
}
