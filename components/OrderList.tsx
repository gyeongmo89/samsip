// 'use client'

// import { useState, useEffect } from 'react'
// import * as XLSX from 'xlsx'

// interface Order {
//   id: number
//   supplier_info: {
//     id: number
//     name: string
//   }
//   item_info: {
//     id: number
//     name: string
//   }
//   unit_info: {
//     id: number
//     name: string
//   }
//   price: number
//   quantity: number
//   total: number
//   payment_cycle: string
//   order_date: string
//   client: string
//   notes: string
// }

// export default function OrderList() {
//   const [orders, setOrders] = useState<Order[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     fetchOrders()
//   }, [])

//   const fetchOrders = async () => {
//     try {
//       setIsLoading(true)
//       const response = await fetch('http://localhost:8000/orders/')
//       if (!response.ok) throw new Error('Failed to fetch orders')
//       const data = await response.json()
//       setOrders(data)
//     } catch (error) {
//       console.error('Error fetching orders:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleExcelDownload = () => {
//     const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
//       '구입처': order.supplier_info.name,
//       '품목': order.item_info.name,
//       '단가': order.price,
//       '단위': order.unit_info.name,
//       '수량': order.quantity,
//       '합계': order.total,
//       '대금지급주기': order.payment_cycle,
//       '주문일자': order.order_date,
//       '거래처': order.client,
//       '비고': order.notes
//     })))

//     const workbook = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(workbook, worksheet, '주문목록')
//     XLSX.writeFile(workbook, '주문목록.xlsx')
//   }

//   if (isLoading) {
//     return (
//       <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 animate-fadeIn">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-bold text-gray-800">주문 목록</h2>
//         </div>
//         <p className="text-gray-500 text-center py-8">Loading...</p>
//       </div>
//     )
//   }

//   if (orders.length === 0) {
//     return (
//       <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 animate-fadeIn">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-bold text-gray-800">주문 목록</h2>
//         </div>
//         <p className="text-gray-500 text-center py-8">등록된 주문이 없습니다.</p>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 animate-fadeIn">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-bold text-gray-800">주문 목록</h2>
//         <button
//           onClick={handleExcelDownload}
//           className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
//         >
//           엑셀 다운로드
//         </button>
//       </div>
      
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구입처</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단위</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">합계</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대금지급주기</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일자</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {orders.map((order) => (
//               <tr key={order.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier_info.name}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.item_info.name}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.price.toLocaleString()}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.unit_info.name}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity.toLocaleString()}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total.toLocaleString()}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.payment_cycle}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.order_date}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.client}</td>
//                 <td className="px-6 py-4 text-sm text-gray-900">{order.notes}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   )
// }
