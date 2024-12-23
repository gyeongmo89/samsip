/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import OrderModal from "@/components/OrderModal";
import Modal from "@/components/Modal";
import Select from "react-select";
import {
  FileDown,
  FileUp,
  Minus,
  Plus,
  Search,
  CheckSquare,
} from "lucide-react";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { API_BASE_URL } from "@/config";

// import { useData } from "@/contexts/DataContext";

interface Order {
  id: number;
  supplier_id: number;
  item_id: number;
  unit_id: number;
  quantity: number;
  price: number;
  total: number;
  payment_cycle: string;
  payment_method: string;
  client: string;
  notes?: string;
  date?: string;
  supplier: Supplier;
  item: Item;
  unit: Unit;
  approval_status?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  review?: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

interface FormData {
  date: string;
  supplier_name: string;
  item_name: string;
  unit_name: string;
  quantity: string;
  price: string;
  total: string;
  payment_cycle: string;
  payment_method: string;
  client: string;
  notes: string;
  review: string;
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
  const [formData, setFormData] = useState<FormData>({
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
    review: "",
  });

  const paymentMethods = ["계좌이체", "현금", "카드결제"];
  const paymentCycles = ["미정", "매월초", "매월중순", "매월말", "기타입력"];

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [approvalPassword, setApprovalPassword] = useState("");
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedOrderForApproval, setSelectedOrderForApproval] =
    useState<Order | null>(null);

  const [isRejectionViewModalOpen, setIsRejectionViewModalOpen] =
    useState(false);
  const [selectedRejectedOrder, setSelectedRejectedOrder] =
    useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // 날짜 범위 상태 추가
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // 날짜 범위 변경 핸들러
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const filteredByDate = orders.filter((order) => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
      setFilteredOrders(filteredByDate);
    } else {
      setFilteredOrders(orders);
    }
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setSelectedOrders([]);
    setSelectAll(false);
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = parseInt(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 페이지당 항목 수가 변경되면 첫 페이지로 이동
  };

  const formatNumber = (value: string | undefined | null) => {
    if (!value) return "";
    const number = value.toString().replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    fetchOrders();
    setSelectedOrders([]);
    setSelectAll(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, itemsRes, unitsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/suppliers`),
          fetch(`${API_BASE_URL}/items`),
          fetch(`${API_BASE_URL}/units`),
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
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      // 날짜를 기준으로 내림차순 정렬 (최신순)
      const sortedData = data.sort((a: Order, b: Order) => {
        return (
          new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
        );
      });
      const processedOrders = sortedData.map((order: Order) => ({
        ...order,
        supplier: order.supplier || { id: 0, name: "삭제됨" },
        item: order.item || { id: 0, name: "삭제됨" },
        unit: order.unit || { id: 0, name: "삭제됨" },
      }));
      setOrders(processedOrders);
      setFilteredOrders(processedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("주문 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 핸들러 수정
  const handleSearch = () => {
    let filtered = orders;

    // 날짜 필터링
    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter((order) => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const searchFields = [
          order.supplier.name,
          order.item.name,
          order.unit.name,
          order.client,
          order.notes,
        ].map((field) => (field || "").toLowerCase());

        return searchFields.some((field) =>
          field.includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [orders, searchTerm, startDate, endDate]);

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      // if (key === "date") {
      //   const dateA = new Date(a[key]);
      //   const dateB = new Date(b[key]);
      //   return direction === "asc"
      //     ? dateA.getTime() - dateB.getTime()
      //     : dateB.getTime() - dateA.getTime();
      // }
      if (key === "date") {
        const dateA = new Date(a[key] || "");
        const dateB = new Date(b[key] || "");
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
      setSelectedOrders(currentItems);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrders((prev) => {
      if (prev.includes(order)) {
        return prev.filter((o) => o !== order);
      } else {
        return [...prev, order];
      }
    });
  };

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      alert("삭제할 주문을 선택해주세요.");
      return;
    }

    // 검토완료 또는 반려된 발주가 있는지 확인
    const processedOrders = selectedOrders.filter(
      (order) => order.approval_status
    );
    if (processedOrders.length > 0) {
      alert("검토완료 또는 반려된 발주건은 삭제할 수 없습니다.");
      return;
    }

    const confirmed = confirm("선택한 주문을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const orderIds = selectedOrders.map((order) => order.id);
      const response = await fetch(`${API_BASE_URL}/orders/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderIds),
      });

      if (!response.ok) {
        throw new Error("Failed to delete orders");
      }

      // 성공적으로 삭제된 경우 UI 업데이트
      setOrders((prevOrders) =>
        prevOrders.filter((order) => !selectedOrders.includes(order))
      );
      setSelectedOrders([]); // 선택 초기화
      setSelectAll(false);
      alert("선택한 주문이 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting orders:", error);
      alert("주문 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleRowClick = (order: Order) => {
    handleSelectOrder(order);
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
    // 엑셀에 포함될 데이터 준비
    const excelData = filteredOrders.map((order) => ({
      날짜: order.date,
      거래처: order.supplier.name,
      품목: order.item.name,
      단가: order.price,
      단위: order.unit.name,
      수량: order.quantity,
      총액: order.total,
      결제주기: order.payment_cycle,
      결제유형: order.payment_method,
      구입연락처: order.client,
      비고: order.notes,
      검토상태: order.approval_status === "approved" ? "검토완료" : "검토대기",
      검토자: order.approved_by || "",
      검토시간: order.approved_at ? formatDateTime(order.approved_at) : "",
    }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "발주목록");

    // 파일 다운로드
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
      const response = await fetch(`${API_BASE_URL}/orders/upload`, {
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

  // const handleEditClick = (order: Order) => {
  //   setEditingOrder(order);
  //   setFormData({
  //     date: order.date,
  //     supplier_name: order.supplier.name,
  //     item_name: order.item.name,
  //     unit_name: order.unit.name,
  //     quantity: order.quantity.toString(),
  //     price: order.price.toString(),
  //     total: order.total.toString(),
  //     payment_cycle: order.payment_cycle,
  //     payment_method: order.payment_method,
  //     client: order.client,
  //     notes: order.notes,
  //   });
  //   setIsEditModalOpen(true);
  // };
  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      date: order.date ?? "",
      supplier_name: order.supplier.name,
      item_name: order.item.name,
      unit_name: order.unit.name,
      quantity: order.quantity.toString(),
      price: order.price.toString(),
      total: order.total.toString(),
      payment_cycle: order.payment_cycle,
      payment_method: order.payment_method,
      client: order.client,
      notes: order.notes ?? "",
      review: order.review ?? "",
    });
    setIsEditModalOpen(true);
  };
  //이상함-----
  const [includeVAT, setIsVatIncluded] = useState(true);

  // VAT 포함 가격 계산 함수
  const calculateVatPrice = (basePrice: number, includeVat: boolean) => {
    return includeVat
      ? Math.round(basePrice * 1.1)
      : Math.round(basePrice / 1.1);
  };

  // 가격 업데이트 함수
  const updatePriceAndTotal = (price: string, quantity: string) => {
    const numPrice = parseFloat(price.replace(/[^\d]/g, "") || "0");
    const numQuantity = parseFloat(quantity.replace(/[^\d]/g, "") || "0");
    const total = numPrice * numQuantity;
    return {
      price: numPrice.toString(),
      total: total.toString(),
    };
  };

  // VAT 토글 변경 시 처리하는 함수
  const handleVatToggle = () => {
    const currentPrice = parseInt(formData.price.replace(/,/g, "") || "0");
    const newPrice = calculateVatPrice(currentPrice, !includeVAT);
    const { total } = updatePriceAndTotal(
      newPrice.toString(),
      formData.quantity
    );

    setFormData((prev) => ({
      ...prev,
      price: newPrice.toString(),
      total,
    }));
    setIsVatIncluded(!includeVAT);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${editingOrder.id}`,
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
      const response = await fetch(`${API_BASE_URL}/orders`, {
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

  const handlePasswordSubmit = () => {
    if (approvalPassword === "admin") {
      setIsPasswordModalOpen(false);
      setIsConfirmationModalOpen(true);
      setApprovalPassword("");
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleBulkApproval = () => {
    // 현재 선택된 주문이 없으면 처리하지 않음
    if (!selectedOrders || selectedOrders.length === 0) {
      alert("검토할 발주를 선택해주세요.");
      return;
    }

    // 선택된 발주 중 이미 처리된 발주가 있는지 확인
    const processedOrders = selectedOrders.filter(
      (order) => order.approval_status
    );
    if (processedOrders.length > 0) {
      alert(
        "이미 처리된 발주가 포함되어 있습니다. 처리되지 않은 발주만 검토할 수 있습니다."
      );
      setSelectedOrders([]); // 선택 초기화
      setSelectAll(false);
      return;
    }

    setIsPasswordModalOpen(true);
  };

  const handleBulkApprovalConfirm = async () => {
    // 실제 처리 시에도 한번 더 체크
    const pendingOrders = selectedOrders.filter(
      (order) => !order.approval_status
    );
    if (pendingOrders.length === 0) {
      alert("처리할 수 있는 발주가 없습니다.");
      setIsConfirmationModalOpen(false);
      return;
    }

    const now = new Date();
    const formattedDate = now
      .toLocaleString("ko-KR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\./g, "-")
      .replace(",", "");

    try {
      // Process each selected order that is pending
      for (const order of pendingOrders) {
        const response = await fetch(
          `${API_BASE_URL}/orders/${order.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: "admin" }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to approve order ${order.id}`);
        }
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (
            selectedOrders.some(
              (selectedOrder) => selectedOrder.id === order.id
            )
          ) {
            return {
              ...order,
              approval_status: "approved",
              approved_by: "이지은",
              approved_at: formattedDate,
            };
          }
          return order;
        })
      );

      // Clear selection and close modal
      setSelectedOrders([]);
      setIsPasswordModalOpen(false);
      setIsConfirmationModalOpen(false);
      alert("선택한 발주가 성공적으로 검토되었습니다.");
    } catch (error) {
      console.error("Error during bulk approval:", error);
      alert("일부 발주 검토 처리 중 오류가 발생했습니다.");
      setIsPasswordModalOpen(false);
      setIsConfirmationModalOpen(false);
    }
  };

  const handleBulkRejection = async () => {
    const now = new Date();
    const formattedDate = now
      .toLocaleString("ko-KR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\./g, "-")
      .replace(",", "");

    try {
      // Process each selected order
      for (const order of selectedOrders) {
        const response = await fetch(
          `${API_BASE_URL}/orders/${order.id}/reject`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              password: "admin",
              rejection_reason: "일괄 반려 처리",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to reject order ${order.id}`);
        }
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (
            selectedOrders.some(
              (selectedOrder) => selectedOrder.id === order.id
            )
          ) {
            return {
              ...order,
              approval_status: "rejected",
              rejection_reason: "일괄 반려 처리",
              approved_by: "이지은",
              approved_at: formattedDate,
            };
          }
          return order;
        })
      );

      // Clear selection and close modal
      setSelectedOrders([]);
      setIsConfirmationModalOpen(false);
      alert("선택한 발주가 성공적으로 반려되었습니다.");
    } catch (error) {
      console.error("Error during bulk rejection:", error);
      alert("일부 발주 반려 처리 중 오류가 발생했습니다.");
      setIsConfirmationModalOpen(false);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!selectedOrderForApproval) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${selectedOrderForApproval.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: "admin" }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to approve order");
      }

      // 현재 시간을 한국 시간대로 포맷팅
      const now = new Date();
      const formattedDate = now
        .toLocaleString("ko-KR", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(/\./g, "-")
        .replace(",", "");

      // 로컬 상태 업데이트
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === selectedOrderForApproval.id) {
            return {
              ...order,
              approval_status: "approved",
              rejection_reason: undefined,
              approved_by: "이지은",
              approved_at: formattedDate,
            };
          }
          return order;
        })
      );

      // 모든 상태 초기화
      setIsConfirmationModalOpen(false);
      setSelectedOrderForApproval(null);
      setIsRejectionViewModalOpen(false);
      setSelectedOrders([]); // 선택된 주문 초기화
      setSelectAll(false); // 전체 선택 체크박스 초기화
      alert("발주가 성공적으로 검토되었습니다.");
    } catch (error) {
      console.error("Error approving order:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    try {
      const ordersToReject = selectedOrderForApproval
        ? [selectedOrderForApproval]
        : selectedOrders;

      for (const order of ordersToReject) {
        const response = await fetch(
          `${API_BASE_URL}/orders/${order.id}/reject`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason: rejectionReason,
              password: "admin",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to reject order ${order.id}`);
        }
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (
            ordersToReject.some((rejectOrder) => rejectOrder.id === order.id)
          ) {
            return {
              ...order,
              approval_status: "rejected",
              rejection_reason: rejectionReason,
              approved_by: "이지은",
              approved_at: new Date().toISOString(),
            };
          }
          return order;
        })
      );

      // Clear selection and close modals
      setSelectedOrders([]);
      setSelectedOrderForApproval(null);
      setIsRejectionModalOpen(false);
      setIsConfirmationModalOpen(false);
      setRejectionReason("");
      alert("발주가 성공적으로 반려되었습니다.");
    } catch (error) {
      console.error("Error during rejection:", error);
      alert("반려 처리 중 오류가 발생했습니다.");
    }
  };

  const handleApprovalClick = (order: Order) => {
    setSelectedOrderForApproval(order);
    setIsPasswordModalOpen(true);
  };

  const handleViewRejection = (order: Order) => {
    setSelectedRejectedOrder(order);
    setIsRejectionViewModalOpen(true);
  };

  const handleReapprovalStart = () => {
    if (selectedRejectedOrder) {
      setSelectedOrderForApproval(selectedRejectedOrder);
      setIsRejectionViewModalOpen(false);
      setIsPasswordModalOpen(true);
    }
  };

  const handleAddOrder = async (orderData: FormData) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to add order");
      }

      const newOrder = await response.json();
      // 새 발주를 배열의 맨 앞에 추가
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      setFilteredOrders((prevFiltered) => [newOrder, ...prevFiltered]);
      alert("발주가 등록되었습니다.");
    } catch (error) {
      console.error("Error adding order:", error);
      alert("발주 등록에 실패했습니다.");
    }
  };

  const handleBulkApprovalWithPassword = async () => {
    const now = new Date();
    const formattedDate = now
      .toLocaleString("ko-KR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\./g, "-")
      .replace(",", "");

    try {
      // Process each selected order
      for (const order of selectedOrders) {
        const response = await fetch(
          `${API_BASE_URL}/orders/${order.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: approvalPassword }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to approve order ${order.id}`);
        }
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (
            selectedOrders.some(
              (selectedOrder) => selectedOrder.id === order.id
            )
          ) {
            return {
              ...order,
              approval_status: "approved",
              approved_by: "이지은",
              approved_at: formattedDate,
            };
          }
          return order;
        })
      );

      // Clear selection and close modal
      setSelectedOrders([]);
      setIsPasswordModalOpen(false);
      setApprovalPassword("");
      alert("선택한 발주가 성공적으로 검토되었습니다.");
    } catch (error) {
      console.error("Error during bulk approval:", error);
      alert("일부 발주 검토 처리 중 오류가 발생했습니다.");
      setIsPasswordModalOpen(false);
      setApprovalPassword("");
    }
  };

  // 시간 포맷팅 함수 추가
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";

    try {
      // 날짜와 시간이 공백으로 구분된 경우 (예: "2024-12-23 15:14")
      const [datePart, timePart] = dateTimeStr.split(' ');
      if (datePart && timePart) {
        return `${datePart} ${timePart}`;
      }

      return dateTimeStr;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateTimeStr;
    }
  };

  const handleApprove = async (orderId: number) => {
    try {
      // 현재 시간을 YYYY-MM-DD HH:mm 형식으로 포맷팅
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${year}-${month}-${day} ${hours}:${minutes}`;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: "이지은",
          approved_at: currentTime
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve order');
      }

      fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('발주 검토 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-4">
      {/* <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12"> */}
      {/* <div className="container bg-red-500 mx-auto px-4"> */}
      <div className="container mx-auto px-4 w-full max-w-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center ">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-2xl font-bold text-gray-800">발주현황</h2>
              <div className="flex gap-2 font-semibold text-sm">
                <button
                  className="px-3 py-1 bg-white text-blue-500 border border-blue-500 rounded hover:bg-blue-100 transition-colors"
                  onClick={() => setFilteredOrders(orders)}
                >
                  전체발주: {orders.length}건
                </button>
                <button
                  className="px-3 py-1 bg-white text-green-500 border border-green-500 rounded hover:bg-green-100 transition-colors"
                  onClick={() =>
                    setFilteredOrders(
                      orders.filter(
                        (order) => order.approval_status === "approved"
                      )
                    )
                  }
                >
                  검토완료:{" "}
                  {
                    orders.filter(
                      (order) => order.approval_status === "approved"
                    ).length
                  }
                  건
                </button>
                <button
                  className="px-3 py-1 bg-white text-yellow-500 border border-yellow-500 rounded hover:bg-yellow-100 transition-colors"
                  onClick={() =>
                    setFilteredOrders(
                      orders.filter((order) => !order.approval_status)
                    )
                  }
                >
                  미검토:{" "}
                  {orders.filter((order) => !order.approval_status).length}건
                </button>
                <button
                  className="px-3 py-1 bg-white text-red-500 border border-red-500 rounded hover:bg-red-100 transition-colors"
                  onClick={() =>
                    setFilteredOrders(
                      orders.filter(
                        (order) => order.approval_status === "rejected"
                      )
                    )
                  }
                >
                  반려:{" "}
                  {
                    orders.filter(
                      (order) => order.approval_status === "rejected"
                    ).length
                  }
                  건
                </button>
              </div>
            </div>
          </div>
          <div className="flex itmems-center justify-between gap-4">
            {/* 페이지당 항목 수 선택 */}
            <div className="flex items-center justify-start gap-2 my-4">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                페이지당 항목 수:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="p-2 border border-gray-300 rounded-md text-gray-900 text-sm"
              >
                <option value={10}>10개씩 보기</option>
                <option value={20}>20개씩 보기</option>
                <option value={50}>50개씩 보기</option>
                <option value={filteredOrders.length}>전체보기</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* 날짜 범위 선택 */}
              {/* <div className="relative">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  isClearable={true}
                  placeholderText="날짜 범위 선택"
                  className="p-2 border border-gray-300 rounded-md text-gray-900 text-sm w-48"
                />
              </div> */}
              <div className="relative flex gap-2">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  onChange={(dates) => {
                    const [start, end] = dates;
                    setStartDate(start);
                    setEndDate(end);
                    if (start && end) {
                      const endOfDay = new Date(end);
                      endOfDay.setHours(23, 59, 59, 999);
                      const filteredByDate = orders.filter((order) => {
                        if (!order.date) return false;
                        const orderDate = new Date(order.date);
                        orderDate.setHours(0, 0, 0, 0);
                        return orderDate >= start && orderDate <= endOfDay;
                      });
                      setFilteredOrders(filteredByDate);
                    } else {
                      setFilteredOrders(orders);
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  isClearable={true}
                  placeholderText="날짜 범위 선택"
                  className="px-6 py-3 border rounded-lg text-black text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-[52px]"
                />
              </div>

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
              {/* <div className="flex gap-2"> */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                등록
              </button>
              <button
                onClick={handleDeleteOrders}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-1 text-sm"
              >
                <Minus className="w-4 h-4" />
                삭제
              </button>
              <button
                onClick={handleExcelDownload}
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-1 shadow-md hover:shadow-lg text-sm"
              >
                <FileDown className="w-4 h-4" />
                다운로드
              </button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center gap-1 shadow-md hover:shadow-lg text-sm">
                  <FileUp className="w-4 h-4" />
                  업로드
                </div>
              </label>
              <button
                onClick={handleBulkApproval}
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-1 shadow-md hover:shadow-lg text-sm"
              >
                <CheckSquare className="w-4 h-4" />
                검토
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
                    결제유형
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
                  <th className="w-[80px] px-2 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    검토
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((order, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(order)}
                  >
                    <td
                      className="px-2 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order)}
                        onChange={() => handleSelectOrder(order)}
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
                    {/* <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      {order.supplier.name.length > 4
                        ? order.supplier.name.slice(0, 4) + ".."
                        : order.supplier.name}
                    </td> */}
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black relative group">
                      <span className="tooltip-trigger">
                        {order.supplier.name.length > 4
                          ? order.supplier.name.slice(0, 4) + ".."
                          : order.supplier.name}
                      </span>
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-sm rounded px-2 py-1 -mt-1 left-1/2 transform -translate-x-1/2">
                        {order.supplier.name}
                      </span>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black relative group">
                      <span className="tooltip-trigger">
                        {order.item.name.length > 6
                          ? order.item.name.slice(0, 6) + ".."
                          : order.item.name}
                      </span>
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-sm rounded px-2 py-1 -mt-1 left-1/2 transform -translate-x-1/2">
                        {order.item.name}
                      </span>
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
                    {/* <td className="px-2 py-4 text-center text-black break-words min-w-[200px]">
                      {order.notes}
                    </td> */}
                    <td className="px-2 py-4 text-center text-black break-words min-w-[200px] relative group">
                      <span className="tooltip-trigger">
                        {order.notes && order.notes.length > 4
                          ? order.notes.slice(0, 4) + ".."
                          : order.notes}
                      </span>
                      {order.notes && order.notes.length > 4 && (
                        <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-sm rounded px-2 py-1 -mt-1 left-1/2 transform -translate-x-1/2">
                          {order.notes}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-black">
                      <button
                        onClick={() => handleEditClick(order)}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${
                          order.approval_status === "approved"
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                        disabled={order.approval_status === "approved"}
                      >
                        수정
                      </button>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      {order.approval_status === "approved" ? (
                        <div className="flex flex-col items-center text-xs text-black">
                          <span className="font-bold">이지은 검토완료</span>
                          <span>{formatDateTime(order.approved_at || '')}</span>
                        </div>
                      ) : order.approval_status === "rejected" ? (
                        <button
                          onClick={() => handleViewRejection(order)}
                          // onClick={() =>   setIsRejectionModalOpen(true)}

                          //여기기
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          반려
                        </button>
                      ) : (
                        // <button
                        //   onClick={() => handleApprovalClick(order)}
                        //   className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        // >
                        //   검토
                        // </button>
                        ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              {"<<"}
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              {"<"}
            </button>

            {/* 페이지 번호 */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              {">"}
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              {">>"}
            </button>

            {/* 전체 페이지 수 표시 */}
            <span className="text-sm text-gray-600 ml-2">
              {currentPage} / {totalPages} 페이지
            </span>
          </div>
        </div>
      </div>

      {/* 주문 등록 모달 */}

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderComplete={fetchOrders}
        onSubmit={handleAddOrder}
      />

      {/* 수정 모달 */}
      <Modal isOpen={isEditModalOpen} title="발주 수정">
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black h-[38px]"
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
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '38px',
                    height: '38px'
                  }),
                }}
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
                styles={{
                  control: (base) => ({
                    ...base,
                    height: '38px',
                    minHeight: '38px'
                  })
                }}
              />
            </div>
            {/* 단가 */}
            <div>
              <div className="flex justify-between items-center h-[21px]">
                <label className="block text-sm font-medium text-gray-700">
                  단가{includeVAT ? "(VAT 포함)" : "(VAT 별도)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeVAT}
                      onChange={handleVatToggle}
                    />
                    <div className={`w-11 h-6 ${includeVAT ? 'bg-purple-600' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">
                    {includeVAT ? 'VAT 포함' : 'VAT 별도'}
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={formatNumber(formData.price) || ""}
                onChange={(e) => {
                  const price = e.target.value.replace(/[^\d]/g, "");
                  const { price: newPrice, total } = updatePriceAndTotal(
                    price,
                    formData.quantity
                  );
                  setFormData({
                    ...formData,
                    price: newPrice,
                    total,
                  });
                }}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
                style={{ height: '38px' }}
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
                  const { price, total } = updatePriceAndTotal(
                    formData.price,
                    quantity
                  );
                  setFormData({
                    ...formData,
                    quantity,
                    total,
                  });
                }}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            {/* 총액 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                총액{includeVAT ? "(VAT 포함)" : "(VAT 별도)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formatNumber(formData.total) || ""}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                readOnly
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

            {/* 결제유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                결제유형 <span className="text-red-500">*</span>
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
                placeholder="결제유형 선택"
                required
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '42px',
                    height: '42px'
                  })
                }}
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black h-[42px]"
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

      {/* 비밀번호 입력 모달 */}
      <Modal isOpen={isPasswordModalOpen} title="관리자 인증">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePasswordSubmit();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            권한이 필요한 기능입니다. 관리자 비밀번호를 입력하세요.
          </p>
          <input
            type="password"
            value={approvalPassword}
            onChange={(e) => setApprovalPassword(e.target.value)}
            className={`mt-1 block w-full p-2 border border-gray-300 rounded-md ${
              approvalPassword ? "text-black" : ""
            }`}
            placeholder="비밀번호 입력"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setApprovalPassword("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handlePasswordSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </form>
      </Modal>

      {/* 승인/반려 선택 모달 */}
      <Modal isOpen={isConfirmationModalOpen} title="검토">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedOrderForApproval
              ? "해당 발주를 검토완료 처리 하시겠습니까?"
              : `선택한 ${selectedOrders.length}개의 발주를 검토하시겠습니까?`}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsConfirmationModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              취소
            </button>
            <button
              onClick={
                selectedOrderForApproval
                  ? handleApprovalSubmit
                  : handleBulkApprovalConfirm
              }
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              검토완료
            </button>
            {/* Only show reject button if not reviewing a rejected order */}
            {(!selectedOrderForApproval ||
              selectedOrderForApproval.approval_status !== "rejected") && (
              <button
                onClick={() => {
                  if (selectedOrders.length === 0) {
                    alert("반려할 발주를 선택해주세요.");
                    return;
                  }
                  setIsRejectionModalOpen(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                반려
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* 반려 사유 입력 모달 */}
      <Modal isOpen={isRejectionModalOpen} title="반려 사유 입력">
        <div className="space-y-4">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
            rows={4}
            placeholder="반려 사유를 입력하세요"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsRejectionModalOpen(false);
                setRejectionReason("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              취소
            </button>
            <button
              onClick={handleRejectionSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              저장
            </button>
          </div>
        </div>
      </Modal>

      {/* 반려 사유 확인 모달 */}
      <Modal isOpen={isRejectionViewModalOpen} title="반려 사유">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">반려 사유:</p>
            <p className="text-black">
              {selectedRejectedOrder?.rejection_reason}
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsRejectionViewModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              취소
            </button>
            <button
              onClick={handleReapprovalStart}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              재검토 완료
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
