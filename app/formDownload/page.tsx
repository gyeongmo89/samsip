'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function DownloadForms() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (formType: 'order' | 'supplier' | 'item') => {
    setIsDownloading(true)
    try {
      const wb = XLSX.utils.book_new()
      let ws
      let fileName

      if (formType === 'order') {
        ws = XLSX.utils.aoa_to_sheet([
          ['발주일(*)', '구입처(*)', '품목(*)', '단가(*)', '단위(*)', '수량(*)', '총액(*)', '결제주기(*)', '대금지급방법(*)', '구입 연락처', '비고']
        ])
        fileName = "발주양식.xlsx"
      } else if (formType === 'supplier') {
        ws = XLSX.utils.aoa_to_sheet([
          ['구입처명(*)', '연락처', '비고']
        ])
        fileName = "구입처양식.xlsx"
      } else {
        ws = XLSX.utils.aoa_to_sheet([
          ['품목명(*)', '단가(*)', '비고']
        ])
        fileName = "품목양식.xlsx"
      }

      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1"
        if (!ws[address]) continue
        ws[address].s = { font: { bold: true }, alignment: { horizontal: "center" } }
      }

      XLSX.utils.book_append_sheet(wb, ws, fileName.split('.')[0])
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Download error:', error)
      alert('양식 다운로드에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">양식 다운로드</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleDownload('order')}
              disabled={isDownloading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-6 h-6" />
              발주양식 다운로드
            </button>
            <button
              onClick={() => handleDownload('supplier')}
              disabled={isDownloading}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-6 h-6" />
              구입처양식 다운로드
            </button>
            <button
              onClick={() => handleDownload('item')}
              disabled={isDownloading}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-6 h-6" />
              품목양식 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
