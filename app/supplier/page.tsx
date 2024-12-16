"use client";

import { useState, useEffect } from "react";
import { FileDown, Plus, Search, Minus } from "lucide-react";
import Modal from "@/components/Modal";
import * as XLSX from "xlsx";
import { useData } from "@/contexts/DataContext";

interface Supplier {
  id: number;
  name: string;
  contact: string;
  address: string;
}

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lastUpdate } = useData();

  useEffect(() => {
    fetchSuppliers();
  }, [lastUpdate]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching suppliers...");
      const response = await fetch("http://localhost:8000/suppliers");
      console.log("Response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      console.log("Received data:", data);
      // 최신 데이터가 위로 오도록 정렬
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setSuppliers(sortedData);
      setFilteredSuppliers(sortedData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("구입처 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      console.log("Submitting supplier data:", formData);
      const response = await fetch("http://localhost:8000/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          address: formData.address, //비고로 사용
        }),
      });
      console.log("Response status:", response.status);

      if (!response.ok) throw new Error("Failed to create supplier");

      alert("구입처가 등록되었습니다.");
      fetchSuppliers();
      setIsModalOpen(false);
      setFormData({ name: "", contact: "", address: "" });
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("구입처 등록 중 오류가 발생했습니다.");
    }
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      contact: supplier.contact || "",
      address: supplier.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      if (!editingSupplier) return;

      const response = await fetch(
        `http://localhost:8000/suppliers/${editingSupplier.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            contact: formData.contact,
            address: formData.address,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update supplier");

      alert("구입처가 수정되었습니다.");
      fetchSuppliers();
      setIsEditModalOpen(false);
      setFormData({ name: "", contact: "", address: "" });
      setEditingSupplier(null);
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("구입처 수정 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const filtered = suppliers.filter(
      (supplier) =>
        (supplier.name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (supplier.contact?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (supplier.address?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
    );
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const handleExcelDownload = () => {
    const excelData = suppliers.map((supplier) => ({
      구입처: supplier.name,
      연락처: supplier.contact,
      주소: supplier.address,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 20 }, // 구입처
      { wch: 15 }, // 연락처
      { wch: 40 }, // 주소
    ];
    ws["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(wb, ws, "구입처 목록");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `구입처목록_${today}.xlsx`);

    alert("엑셀 다운로드 완료");
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedSuppliers(
        filteredSuppliers.map((_, index) => index.toString())
      );
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectSupplier = (index: string) => {
    setSelectedSuppliers((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      alert("삭제할 구입처를 선택해주세요.");
      return;
    }

    const confirmed = confirm("선택한 구입처를 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const supplierIds = selectedSuppliers.map(
        (index) => filteredSuppliers[parseInt(index)].id
      );
      const response = await fetch(
        "http://localhost:8000/suppliers/bulk-delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(supplierIds),
        }
      );

      if (response.ok) {
        fetchSuppliers();
        setSelectedSuppliers([]);
        setSelectAll(false);
        alert("선택한 구입처가 삭제되었습니다.");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "구입처 삭제 실패");
      }
    } catch (error) {
      console.error("Error deleting suppliers:", error);
      alert("구입처 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">구입처 관리</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(e.target.value)}
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

              {/* 구입처 등록/삭제 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  구입처 등록
                </button>
                <button
                  onClick={handleDeleteSuppliers}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  구입처 삭제
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

          {/* 로딩 상태 표시 */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 메시지 표시 */}
          {error && (
            <div className="text-center py-4">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchSuppliers}
                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 데이터가 있을 때만 테이블 표시 */}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                      구입처명
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                      비고
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                      수정
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier, index) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectSupplier(index.toString())}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(index.toString())}
                          onChange={() =>
                            handleSelectSupplier(index.toString())
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-black">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-black">
                        {supplier.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-black">
                        {supplier.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-black">
                        <button
                          onClick={() => handleEditClick(supplier)}
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
          )}
        </div>
      </div>

      {/* 등록 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="구입처 등록"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              구입처명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              연락처
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value.length <= 11) {
                  if (value.length > 7) {
                    value = value.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
                  } else if (value.length > 3) {
                    value = value.replace(/(\d{3})(\d{1,4})/, "$1-$2");
                  }
                  setFormData({ ...formData, contact: value });
                }
              }}
              placeholder="010-0000-0000"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              비고
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          setIsEditModalOpen(false);
          setFormData({ name: "", contact: "", address: "" });
          setEditingSupplier(null);
        }}
        title="구입처 수정"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                구입처명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                연락처
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 11) {
                    if (value.length > 7) {
                      value = value.replace(
                        /(\d{3})(\d{4})(\d{4})/,
                        "$1-$2-$3"
                      );
                    } else if (value.length > 3) {
                      value = value.replace(/(\d{3})(\d{1,4})/, "$1-$2");
                    }
                    setFormData({ ...formData, contact: value });
                  }
                }}
                placeholder="010-0000-0000"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                비고
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setFormData({ name: "", contact: "", address: "" });
                setEditingSupplier(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              수정 완료
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
