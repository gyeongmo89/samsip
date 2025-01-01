"use client";

import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";

export default function DownloadForms() {
  const handleDownload = (formType: "order" | "supplier" | "item") => {
    const wb = XLSX.utils.book_new();
    let ws;
    let fileName;

    if (formType === "order") {
      // 발주 양식
      const template = [
        {
          "발주일(*)": "YYYY.M.D(ex. 2024.1.1)",
          "구입처(*)": "",
          "품목(*)": "",
          "단가(*)": "",
          "단위": "", // updated field name
          "수량": "숫자만 입력(ex. 1)", // updated field name
          "총액": "=D2*F2", // updated field name // 단가 * 수량
          "대금지급주기": "미정 or 마감후 한달안 or 매주 월요일 or 월초카드결제 or 주문과 동시결제 or 카드결제(선결제)", // updated field name
          "구입주기": "daily or weekly or monthly", // updated field name
          구입연락처: "010-0000-0000",
          비고: "부가세 별도",
        },
      ];
      ws = XLSX.utils.json_to_sheet(template);
      fileName = "발주_양식.xlsx";

      // 열 너비 설정
      const columnWidths = [
        { wch: 14 }, // 발주일
        { wch: 15 }, // 구입처
        { wch: 20 }, // 품목
        { wch: 10 }, // 단가
        { wch: 8 }, // 단위
        { wch: 8 }, // 수량
        { wch: 12 }, // 총액
        { wch: 25 }, // 대금지급주기
        { wch: 18 }, // 구입주기
        { wch: 15 }, // 구입연락처
        { wch: 30 }, // 비고
      ];
      ws["!cols"] = columnWidths;
    } else if (formType === "supplier") {
      // 구입처 양식
      const template = [
        {          
          "구입처(*)": "",
          연락처: "010-0000-0000",
          비고: "",
        },
      ];
      ws = XLSX.utils.json_to_sheet(template);
      fileName = "구입처_양식.xlsx";

      // 열 너비 설정
      const columnWidths = [
        { wch: 20 }, // 구입처
        { wch: 15 }, // 연락처
        { wch: 40 }, // 주소
      ];
      ws["!cols"] = columnWidths;
    } else {
      // 품목 양식
      const template = [
        {          
          "품목(*)": "",
          "가격(*)": "",          
          비고: "(ex. 부가세 별도)",
        },
      ];
      ws = XLSX.utils.json_to_sheet(template);
      fileName = "품목_양식.xlsx";

      // 열 너비 설정
      const columnWidths = [
        { wch: 20 }, // 품목
        { wch: 12 }, // 가격
        { wch: 40 }, // 비고
      ];
      ws["!cols"] = columnWidths;
    }

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, "양식");

    // 파일 다운로드
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl text-gray-800 font-bold mb-6">
            양식 다운로드
          </h1>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg text-gray-800 font-semibold mb-2">
                발주 등록 양식
              </h2>
              <p className="text-gray-600 mb-4">
                발주 정보를 일괄 등록하기 위한 엑셀 양식입니다. 다운로드 받은
                양식에 데이터를 입력한 후, 발주 관리 페이지에서 업로드하세요.
              </p>
              <button
                onClick={() => handleDownload("order")}
                className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <FileDown className="w-6 h-6" />
                발주 양식 다운로드
              </button>
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                구입처 등록 양식
              </h2>
              <p className="text-gray-600 mb-4">
                구입처 정보를 일괄 등록하기 위한 엑셀 양식입니다.
              </p>
              <button
                onClick={() => handleDownload("supplier")}
                className="bg-gradient-to-r from-purple-400 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <FileDown className="w-6 h-6" />
                구입처 양식 다운로드
              </button>
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                품목 등록 양식
              </h2>
              <p className="text-gray-600 mb-4">
                품목 정보를 일괄 등록하기 위한 엑셀 양식입니다.
              </p>
              <button
                onClick={() => handleDownload("item")}
                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <FileDown className="w-6 h-6" />
                품목 양식 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
