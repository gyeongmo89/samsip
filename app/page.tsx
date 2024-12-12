import Image from "next/image";
import OrderList from '@/components/OrderList'
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 py-12">
    //   <div className="max-w-7xl mx-auto px-4">
    //     <h1 className="text-3xl font-bold text-white mb-6">삼십일미 발주프로그램</h1>
    //     <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
    //       <p className="text-gray-600">
    //         발주 관리 시스템에 오신 것을 환영합니다.
    //       </p>
    //     </div>
    //   </div>
    // </div>
    <div className="px-4 py-2">
      <Dashboard />
    </div>
  )
}
