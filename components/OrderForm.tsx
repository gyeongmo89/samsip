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
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null)
  const [selectedItem, setSelectedItem] = useState<Option | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Option | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [total, setTotal] = useState('')
  const [paymentCycle, setPaymentCycle] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [client, setClient] = useState('')
  const [notes, setNotes] = useState('')
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
    if (price && quantity) {
      const calculatedTotal = Number(price) * Number(quantity)
      setTotal(calculatedTotal.toString())
    } else {
      setTotal('')
    }
  }, [price, quantity])

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
      price: Number(price),
      quantity: Number(quantity),
      total: Number(total),
      payment_cycle: paymentCycle,
      order_date: orderDate,
      client,
      notes
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
      setPrice('')
      setQuantity('')
      setTotal('')
      setPaymentCycle('')
      setOrderDate('')
      setClient('')
      setNotes('')

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">공급업체</label>
        <Select
          value={selectedSupplier}
          onChange={(option) => setSelectedSupplier(option as SupplierOption)}
          options={supplierOptions}
          className="mt-1 text-black"
          placeholder="공급업체를 선택하세요"
          isSearchable
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">품목</label>
        <Select
          value={selectedItem}
          onChange={(option) => setSelectedItem(option as Option)}
          options={itemOptions}
          className="mt-1 text-black"
          placeholder="품목을 선택하세요"
          isSearchable
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">단위</label>
        <Select
          value={selectedUnit}
          onChange={(option) => setSelectedUnit(option as Option)}
          options={unitOptions}
          className="mt-1 text-black"
          placeholder="단위를 선택하세요"
          isSearchable
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">단가</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11"
          placeholder="단가를 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">수량</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11"
          placeholder="수량을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">합계</label>
        <input
          type="number"
          value={total}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11 bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">대금지급주기</label>
        <input
          type="text"
          value={paymentCycle}
          onChange={(e) => setPaymentCycle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11"
          placeholder="대금지급주기를 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">주문일자</label>
        <input
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">거래처</label>
        <input
          type="text"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-11"
          placeholder="거래처를 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">비고</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          rows={3}
          placeholder="비고를 입력하세요"
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          주문 등록
        </button>
      </div>
    </form>
  )
}
