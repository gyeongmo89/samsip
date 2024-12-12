// 주문현황은 주석처리
// 'use client'

// import { useState, useEffect } from 'react'
// import { saveAs } from 'file-saver'
// import * as XLSX from 'xlsx'

// interface Order {
//   supplier: string
//   item: string
//   unit: string
//   price: number
//   quantity: number
//   total: number
//   paymentCycle: string
//   orderDate: string
//   client: string
//   notes: string
// }

// export default function OrderListPage() {
//   const [orders, setOrders] = useState<Order[]>([])
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedMonth, setSelectedMonth] = useState('')
//   const [filteredOrders, setFilteredOrders] = useState<Order[]>([])

//   useEffect(() => {
//     const savedOrders = localStorage.getItem('orders')
//     if (savedOrders) {
//       const parsedOrders = JSON.parse(savedOrders)
//       const sanitizedOrders = parsedOrders.map((order: any) => ({
//         ...order,
//         supplier: typeof order.supplier === 'object' ? order.supplier.label || '' : order.supplier,
//         item: typeof order.item === 'object' ? order.item.label || '' : order.item,
//         unit: typeof order.unit === 'object' ? order.unit.label || '' : order.unit
//       }))
//       setOrders(sanitizedOrders)
//     }
//   }, [])

//   useEffect(() => {
//     const handleOrdersUpdate = () => {
//       const savedOrders = localStorage.getItem('orders')
//       if (savedOrders) {
//         const parsedOrders = JSON.parse(savedOrders)
//         const sanitizedOrders = parsedOrders.map((order: any) => ({
//           ...order,
//           supplier: typeof order.supplier === 'object' ? order.supplier.label || '' : order.supplier,
//           item: typeof order.item === 'object' ? order.item.label || '' : order.item,
//           unit: typeof order.unit === 'object' ? order.unit.label || '' : order.unit
//         }))
//         setOrders(sanitizedOrders)
//       }
//     }

//     window.addEventListener('ordersUpdated', handleOrdersUpdate)
//     return () => {
//       window.removeEventListener('ordersUpdated', handleOrdersUpdate)
//     }
//   }, [])

//   useEffect(() => {
//     let filtered = [...orders]

//     if (searchTerm) {
//       filtered = filtered.filter(order => 
//         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         order.notes.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     if (selectedMonth) {
//       filtered = filtered.filter(order => {
//         const orderDate = new Date(order.orderDate)
//         const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
//         return orderMonth === selectedMonth
//       })
//     }

//     setFilteredOrders(filtered)
//   }, [orders, searchTerm, selectedMonth])

//   const handleExportExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(filteredOrders)
//     const workbook = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(workbook, worksheet, '주문목록')
    
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
//     const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
//     const date = new Date()
//     const fileName = `주문목록_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.xlsx`
    
//     saveAs(data, fileName)
//   }

//   const generateMonthOptions = () => {
//     const months = new Set<string>()
//     orders.forEach(order => {
//       const date = new Date(order.orderDate)
//       const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
//       months.add(monthStr)
//     })
//     return Array.from(months).sort().reverse()
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 py-12">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
//             <input
//               type="text"
//               placeholder="검색어를 입력하세요..."
//               className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-600"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <select
//               className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//             >
//               <option value="" className="text-black">전체 기간</option>
//               {generateMonthOptions().map(month => (
//                 <option key={month} value={month}>
//                   {month.replace('-', '년 ')}월
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={handleExportExcel}
//             className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-full md:w-auto font-semibold shadow-lg hover:shadow-xl"
//           >
//             엑셀 다운로드
//           </button>
//         </div>

//         <div className="overflow-x-auto bg-white rounded-lg shadow">
//           <table className="min-w-full">
//             <thead>
//               <tr className="bg-gray-50">
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일자</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단위</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총액</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제주기</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredOrders.map((order, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderDate}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.item}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.unit}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {typeof order.price === 'number' ? order.price.toLocaleString() : '0'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {typeof order.quantity === 'number' ? order.quantity.toLocaleString() : '0'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {typeof order.total === 'number' ? order.total.toLocaleString() : '0'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.paymentCycle}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.client}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.notes}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   )
// }
