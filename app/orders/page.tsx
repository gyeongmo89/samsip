/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import OrderModal from "@/components/OrderModal";
import Modal from "@/components/Modal";
import Select from "react-select";
import { FileDown, FileUp, Minus, Plus, Search } from "lucide-react";
import * as XLSX from "xlsx";
// import { useData } from "@/contexts/DataContext";

interface Order {
  id: number;
  date: string;
  supplier: { id: number; name: string };
  item: { id: number; name: string };
  unit: { id: number; name: string };
  quantity: number;
  price: number;
  total: number;
  payment_cycle: string;
  payment_method: string;
  client: string;
  notes: string;
}

// interface OrderModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onOrderComplete: () => void
// }

export default function OrderList() {
  // const { refreshData } = useData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]); // Added type annotation
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    supplier_name: "",
    item_name: "",
    unit_name: "",
    quantity: "",
    price: "",
    total: "",
    payment_cycle: "",
    payment_method: "계좌이체",
    client: "",
    notes: "",
  });

  const paymentMethods = ["계좌이체", "현금", "카드결제"];
  const paymentCycles = ["미정", "매월초", "매월중순", "매월말", "기타입력"];

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const formatNumber = (value: string | undefined | null) => {
    if (!value) return "";
    const number = value.toString().replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, itemsRes, unitsRes] = await Promise.all([
          fetch("http://localhost:8000/suppliers"),
          fetch("http://localhost:8000/items"),
          fetch("http://localhost:8000/units"),
        ]);

        if (!suppliersRes.ok || !itemsRes.ok || !unitsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [suppliersData, itemsData, unitsData] = await Promise.all([
          suppliersRes.json(),
          itemsRes.json(),
          unitsRes.json(),
        ]);

        setSuppliers(
          suppliersData.map((s: any) => ({ value: s.name, label: s.name }))
        );
        setItems(itemsData.map((i: any) => ({ value: i.name, label: i.name })));
        setUnits(unitsData.map((u: any) => ({ value: u.name, label: u.name })));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setFilteredOrders(
      orders.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (order.supplier?.name || "").toLowerCase().includes(searchLower) ||
          (order.item?.name || "").toLowerCase().includes(searchLower) ||
          (order.client || "").toLowerCase().includes(searchLower)
        );
      })
    );
  }, [orders, searchTerm]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:8000/orders", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setOrders([]);
          setFilteredOrders([]);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch orders");
      }

      const data = await response.json();
      // 최신 데이터가 위로 오도록 정렬
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setOrders(sortedData);
      setFilteredOrders(sortedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  const handleSearch = () => {
    const filteredOrders = orders.filter(
      (order) =>
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setOrders(filteredOrders);
    if (!searchTerm) {
      fetchOrders();
    }
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      if (key === "date") {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return direction === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      let aValue = key.includes(".")
        ? key
            .split(".")
            .reduce(
              (obj: { [x: string]: any }, k: string | number) => obj[k],
              a
            )
        : (a as any)[key];
      let bValue = key.includes(".")
        ? key
            .split(".")
            .reduce(
              (obj: { [x: string]: any }, k: string | number) => obj[k],
              b
            )
        : (b as any)[key];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(sortedOrders);
  };

  const handleSelectAll = (e: {
    target: { checked: boolean | ((prevState: boolean) => boolean) };
  }) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map((_, index) => index.toString()));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (index: string) => {
    setSelectedOrders((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      alert("삭제할 주문을 선택해주세요.");
      return;
    }

    const confirmed = confirm("선택한 주문을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const orderIds = selectedOrders.map(
        (index) => filteredOrders[Number(index)].id
      );
      const response = await fetch("http://localhost:8000/orders/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderIds),
      });

      if (response.ok) {
        fetchOrders();
        setSelectedOrders([]);
        setSelectAll(false);
        alert("선택한 주문이 삭제되었습니다.");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "주문 삭제 실패");
      }
    } catch (error) {
      console.error("Error deleting orders:", error);
      alert("주문 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleRowClick = (index: string) => {
    handleSelectOrder(index);
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      if (value.length > 7) {
        value = value.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,4})/, "$1-$2");
      }
      setFormData((prev) => ({ ...prev, client: value }));
    }
  };

  const handleExcelDownload = () => {
    const excelData = orders.map((order) => ({
      발주일: order.date,
      구입처: order.supplier.name,
      품목: order.item.name,
      단가: order.price,
      단위: order.unit.name,
      수량: order.quantity,
      총액: order.total,
      결제주기: order.payment_cycle,
      대금지급방법: order.payment_method,
      구입연락처: order.client,
      비고: order.notes,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 12 }, // 발주일
      { wch: 15 }, // 구입처
      { wch: 20 }, // 품목
      { wch: 10 }, // 단가
      { wch: 8 }, // 단위
      { wch: 8 }, // 수량
      { wch: 12 }, // 총액
      { wch: 12 }, // 결제주기
      { wch: 15 }, // 대금지급방법
      { wch: 15 }, // 구입연락처
      { wch: 30 }, // 비고
    ];
    ws["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(wb, ws, "발주 목록");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `발주목록_${today}.xlsx`);

    alert("엑셀 다운로드 완료");
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/orders/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("엑셀 파일이 성공적으로 업로드되었습니다.");
        // 목록 새로고침
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`업로드 실패: ${error.detail}`);
      }
    } catch (error) {
      alert("업로드 중 오류가 발생했습니다.");
      console.error("Upload error:", error);
    }
  };

  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      date: order.date,
      supplier_name: order.supplier.name,
      item_name: order.item.name,
      unit_name: order.unit.name,
      quantity: order.quantity.toString(),
      price: order.price.toString(),
      total: order.total.toString(),
      payment_cycle: order.payment_cycle,
      payment_method: order.payment_method,
      client: order.client,
      notes: order.notes,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const response = await fetch(
        `http://localhost:8000/orders/${editingOrder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            quantity: parseFloat(formData.quantity.replace(/[^\d]/g, "")),
            price: parseFloat(formData.price.replace(/[^\d]/g, "")),
            total: parseFloat(formData.total.replace(/[^\d]/g, "")),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      alert("수정 완료");
      fetchOrders();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("수정 실패");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity.replace(/[^\d]/g, "")),
          price: parseFloat(formData.price.replace(/[^\d]/g, "")),
          total: parseFloat(formData.total.replace(/[^\d]/g, "")),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      alert("주문이 등록되었습니다.");
      fetchOrders();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("주문 등록 중 오류가 발생했습니다.");
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">발주현황</h2>
            <div className="flex gap-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="검색어를 입력하세요"
                  className="px-6 py-3 border rounded-lg text-black w-80 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleSearch}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>

              {/* 발주등록 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  발주등록
                </button>
                <button
                  onClick={handleDeleteOrders}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  발주삭제
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
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-2 shadow-lg">
                  <FileUp className="w-6 h-6" />
                  엑셀 업로드
                </div>
              </label>
            </div>
          </div>

          {/* 발주 목록 테이블 */}
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[40px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="w-[100px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("date")}
                  >
                    발주일
                    {sortConfig.key === "date" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="w-[120px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    구입처
                  </th>
                  <th className="w-[150px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    품목
                  </th>
                  <th className="w-[100px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    단가
                  </th>
                  <th className="w-[80px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    단위
                  </th>
                  <th className="w-[80px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    수량
                  </th>
                  <th className="w-[100px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    총액
                  </th>
                  <th className="w-[100px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    결제주기
                  </th>
                  <th className="w-[120px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    대금지급방법
                  </th>
                  <th className="w-[120px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    구입연락처
                  </th>
                  <th className="w-[200px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    비고
                  </th>
                  <th className="w-[80px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    수정
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(index.toString())}
                  >
                    <td
                      className="px-2 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(index.toString())}
                        onChange={() => handleSelectOrder(index.toString())}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.date
                        ? new Date(order.date)
                            .toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })
                            .replace(/\. /g, "-")
                            .slice(0, -1)
                        : ""}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.supplier.name}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.item.name}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.price.toLocaleString()}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.unit.name}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.total.toLocaleString()}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.payment_cycle}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.payment_method}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.client}
                    </td>
                    <td className="px-2 py-4 text-center text-black break-words min-w-[200px]">
                      {order.notes}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      <button
                        onClick={() => handleEditClick(order)}
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
        </div>
      </div>

      {/* 주문 등록 모달 */}
      {/* <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderComplete={fetchOrders}
        // onSubmit={handleSubmit}
        onSubmit={handleSubmit}
      /> */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderComplete={fetchOrders}
        onSubmit={handleSubmit}
      />

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="발주 정보 수정"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 발주일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                발주일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            {/* 구입처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                구입처 <span className="text-red-500">*</span>
              </label>
              <Select
                value={{
                  value: formData.supplier_name,
                  label: formData.supplier_name,
                }}
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    supplier_name: option?.value || "",
                  })
                }
                options={suppliers}
                className="mt-1 text-black"
                classNamePrefix="select"
                placeholder="구입처 선택"
                required
              />
            </div>

            {/* 품목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                품목 <span className="text-red-500">*</span>
              </label>
              <Select
                value={{ value: formData.item_name, label: formData.item_name }}
                onChange={(option) =>
                  setFormData({ ...formData, item_name: option?.value || "" })
                }
                options={items}
                className="mt-1 text-black"
                classNamePrefix="select"
                placeholder="품목 선택"
                required
              />
            </div>

            {/* 단위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                단위 <span className="text-red-500">*</span>
              </label>
              <Select
                value={{ value: formData.unit_name, label: formData.unit_name }}
                onChange={(option) =>
                  setFormData({ ...formData, unit_name: option?.value || "" })
                }
                options={units}
                className="mt-1 text-black"
                classNamePrefix="select"
                placeholder="단위 선택"
                required
              />
            </div>

            {/* 수량 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formatNumber(formData.quantity) || ""}
                onChange={(e) => {
                  const quantity = e.target.value.replace(/[^\d]/g, "");
                  const price = formData.price.replace(/[^\d]/g, "");
                  setFormData({
                    ...formData,
                    quantity,
                    total: (
                      parseFloat(price || "0") * parseFloat(quantity || "0")
                    ).toString(),
                  });
                }}
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
                value={formatNumber(formData.price) || ""}
                onChange={(e) => {
                  const price = e.target.value.replace(/[^\d]/g, "");
                  const quantity = formData.quantity.replace(/[^\d]/g, "");
                  setFormData({
                    ...formData,
                    price,
                    total: (
                      parseFloat(price || "0") * parseFloat(quantity || "0")
                    ).toString(),
                  });
                }}
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
                value={formatNumber(formData.total) || ""}
                readOnly
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                required
              />
            </div>

            {/* 결제주기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                결제주기 <span className="text-red-500">*</span>
              </label>
              <Select
                value={{
                  value: formData.payment_cycle,
                  label: formData.payment_cycle,
                }}
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    payment_cycle: option?.value || "",
                  })
                }
                options={paymentCycles.map((cycle) => ({
                  value: cycle,
                  label: cycle,
                }))}
                className="mt-1 text-black"
                classNamePrefix="select"
                placeholder="결제주기 선택"
                required
              />
            </div>

            {/* 대금지급방법 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                대금지급방법 <span className="text-red-500">*</span>
              </label>
              <Select
                value={{
                  value: formData.payment_method,
                  label: formData.payment_method,
                }}
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    payment_method: option?.value || "",
                  })
                }
                options={paymentMethods.map((method) => ({
                  value: method,
                  label: method,
                }))}
                className="mt-1 text-black"
                classNamePrefix="select"
                placeholder="대금지급방법 선택"
                required
              />
            </div>

            {/* 구입 연락처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                구입 연락처
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={handlePhoneNumberChange}
                placeholder="010-0000-0000"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            {/* 비고 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                비고
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              수정 완료
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
