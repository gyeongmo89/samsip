'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Props } from 'react-select'

// Client-side only import of react-select
const Select = dynamic(() => import('react-select'), {
  ssr: false,
})

interface Option {
  value: string
  label: string
}

interface SupplierOption extends Option {
  contact?: string
}

interface Supplier {
  id: number
  name: string
  contact?: string
  address?: string
}

interface Item {
  id: number
  name: string
  description?: string
}

interface Unit {
  id: number
  name: string
}

export default function OrderForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
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
  })

  const paymentMethods = ['계좌이체', '현금', '카드결제']

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null)
  const [selectedItem, setSelectedItem] = useState<Option | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Option | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([])
  const [itemOptions, setItemOptions] = useState<Option[]>([])
  const [unitOptions, setUnitOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const suppliersRes = await fetch('http://localhost:8000/suppliers/')
        const itemsRes = await fetch('http://localhost:8000/items/')
        const unitsRes = await fetch('http://localhost:8000/units/')

        const suppliersData = await suppliersRes.json()
        const itemsData = await itemsRes.json()
        const unitsData = await unitsRes.json()

        console.log('Raw API Response:', {
          suppliers: suppliersData,
          items: itemsData,
          units: unitsData
        })

        // Transform the data for react-select
        const supplierOptions = suppliersData.map((supplier: any) => ({
          value: supplier.id.toString(),
          label: supplier.name,
          contact: supplier.contact
        }))

        const itemOptions = itemsData.map((item: any) => ({
          value: item.id.toString(),
          label: item.name
        }))

        const unitOptions = unitsData.map((unit: any) => ({
          value: unit.id.toString(),
          label: unit.name
        }))

        console.log('Transformed options:', {
          suppliers: supplierOptions,
          items: itemOptions,
          units: unitOptions
        })

        setSupplierOptions(supplierOptions)
        setItemOptions(itemOptions)
        setUnitOptions(unitOptions)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (formData.price && formData.quantity) {
      const calculatedTotal = Number(formData.price) * Number(formData.quantity)
      setFormData({ ...formData, total: calculatedTotal.toString() })
    } else {
      setFormData({ ...formData, total: '' })
    }
  }, [formData.price, formData.quantity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSupplier || !selectedItem || !selectedUnit) {
      alert('Please select supplier, item, and unit')
      return
    }

    const newOrder = {
      supplier_id: parseInt(selectedSupplier.value),
      item_id: parseInt(selectedItem.value),
      unit_id: parseInt(selectedUnit.value),
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      total: Number(formData.total),
      payment_cycle: formData.payment_cycle,
      payment_method: formData.payment_method,
      client: formData.client,
      notes: formData.notes,
      date: formData.date
    }

    try {
      const response = await fetch('http://localhost:8000/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create order')
      }

      setSelectedSupplier(null)
      setSelectedItem(null)
      setSelectedUnit(null)
      setFormData({
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
      })

      router.push('/orderlist')
    } catch (error) {
      console.error('Error creating order:', error)
      alert(error instanceof Error ? error.message : 'Failed to create order. Please try again.')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center text-red-600">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* 구입처 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            구입처 <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedSupplier}
            onChange={(option) => setSelectedSupplier(option as SupplierOption)}
            options={supplierOptions}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="구입처를 선택하세요"
            isSearchable
          />
        </div>

        {/* 품목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            품목 <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedItem}
            onChange={(option) => setSelectedItem(option as Option)}
            options={itemOptions}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="품목을 선택하세요"
            isSearchable
          />
        </div>

        {/* 단위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            단위 <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedUnit}
            onChange={(option) => setSelectedUnit(option as Option)}
            options={unitOptions}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="단위를 선택하세요"
            isSearchable
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
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 단가 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            단가 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 총액 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            총액 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.total}
            readOnly
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            required
          />
        </div>

        {/* 결제주기 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            결제주기 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.payment_cycle}
            onChange={(e) => handleInputChange('payment_cycle', e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 대금지급방법 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            대금지급방법 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => handleInputChange('payment_method', e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            onChange={(e) => handleInputChange('client', e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={() => router.push('/orderlist')}
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
  )
}
