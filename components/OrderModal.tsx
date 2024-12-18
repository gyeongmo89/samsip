/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, ReactNode } from "react";
import Modal from "./Modal";
import Select from "react-select";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: () => void;
  onSubmit?: (formData: any) => Promise<void>;
}

interface Supplier {
  [x: string]: ReactNode;
  // [x: string]: ReactNode
  id: number;
  contact?: string;
  // Add other supplier properties as needed
}

interface Item {
  id: number;
  name: string;
  price?: number;
  description?: string;
}

interface Unit {
  id: number;
  name: string;
}

const defaultFormData = {
  supplier_id: "",
  item_id: "",
  unit_id: "",
  quantity: "",
  price: "",
  total: "",
  payment_cycle: "",
  payment_method: "계좌이체",
  client: "",
  notes: "",
  date: new Date().toISOString().split("T")[0],
  custom_payment_cycle: "",
};

export default function OrderModal({
  isOpen,
  onClose,
  onOrderComplete,
  onSubmit,
}: OrderModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState(defaultFormData);
  const [showDaySelect, setShowDaySelect] = useState(false);
  const [isVatIncluded, setIsVatIncluded] = useState(true);

  const paymentMethods = ["계좌이체", "현금", "카드결제"];
  const paymentCycles = ["미정", "매월초", "매월중순", "매월말", "기타입력"];

  const formatNumber = (value: string | undefined | null) => {
    if (!value) return "";
    const number = value.toString().replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputChange = (field: string, value: string) => {
    if (["quantity", "price", "total"].includes(field)) {
      const numericValue = value.replace(/[^\d]/g, "");
      setFormData((prev) => ({ ...prev, [field]: numericValue || "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData);
      setShowDaySelect(false);
      setIsVatIncluded(true);
      localStorage.removeItem("lastOrder");
    }
  }, [isOpen]);

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

        setSuppliers(suppliersData);
        setItems(itemsData);
        setUnits(unitsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const lastOrder = JSON.parse(localStorage.getItem("lastOrder") || "{}");
      if (Object.keys(lastOrder).length > 0) {
        setFormData(lastOrder);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: parseInt(formData.supplier_id),
          item_id: parseInt(formData.item_id),
          unit_id: parseInt(formData.unit_id),
          quantity: parseFloat(formData.quantity.replace(/,/g, "")),
          price: parseFloat(formData.price.replace(/,/g, "")),
          total: parseFloat(formData.total.replace(/,/g, "")),
          payment_cycle:
            formData.payment_cycle === "기타입력"
              ? formData.custom_payment_cycle
              : formData.payment_cycle,
          payment_method: formData.payment_method,
          client: formData.client,
          notes: formData.notes,
          date: formData.date,
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      alert("발주가 등록되었습니다.");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("발주 등록 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (formData.price && formData.quantity) {
      const price = parseInt(formData.price.replace(/[^\d]/g, "") || "0");
      const quantity = parseInt(formData.quantity.replace(/[^\d]/g, "") || "0");
      const calculatedTotal = price * quantity;
      setFormData((prev) => ({ ...prev, total: calculatedTotal.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, total: "" }));
    }
  }, [formData.price, formData.quantity]);

  const handlePaymentCycleChange = (value: string) => {
    if (value === "기타입력") {
      setShowDaySelect(true);
      setFormData((prev) => ({ ...prev, payment_cycle: "1" }));
    } else {
      setShowDaySelect(false);
      setFormData((prev) => ({ ...prev, payment_cycle: value }));
    }
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

  // VAT 포함 가격 계산 함수
  const calculateVatPrice = (basePrice: number, includeVat: boolean) => {
    return includeVat ? Math.round(basePrice * 1.1) : basePrice;
  };

  // 품목 선택 시 처리하는 함수
  const handleItemSelect = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === parseInt(itemId));
    if (selectedItem) {
      // 비고란에 "부가세별도"가 포함되어 있는지 확인
      const isVatExcluded = selectedItem.description?.includes("부가세별도");
      // VAT 토글 상태 설정 (부가세별도면 false, 아니면 true)
      setIsVatIncluded(!isVatExcluded);

      // 선택된 품목의 가격 설정
      const basePrice = selectedItem.price || 0;
      setFormData((prev) => ({
        ...prev,
        item_id: itemId,
        price: basePrice.toString(),
      }));
    }
  };

  // VAT 토글 변경 시 처리하는 함수
  const handleVatToggle = () => {
    const selectedItem = items.find(
      (item) => item.id === parseInt(formData.item_id)
    );
    if (selectedItem) {
      const basePrice = selectedItem.price || 0;
      const currentPrice = parseInt(formData.price.replace(/,/g, "") || "0");

      // VAT 포함 -> 제외
      if (isVatIncluded) {
        const newPrice = Math.round(currentPrice / 1.1);
        setFormData((prev) => ({ ...prev, price: newPrice.toString() }));
      }
      // VAT 제외 -> 포함
      else {
        const newPrice = calculateVatPrice(basePrice, true);
        setFormData((prev) => ({ ...prev, price: newPrice.toString() }));
      }
      setIsVatIncluded(!isVatIncluded);
    }
  };

  return (
    <Modal isOpen={isOpen} title="발주 등록">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 구입처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              구입처 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => {
                const selectedSupplierId = e.target.value;
                const supplier = suppliers.find(
                  (s) => s.id === parseInt(selectedSupplierId)
                );
                if (supplier) {
                  setFormData((prev) => ({
                    ...prev,
                    supplier_id: selectedSupplierId,
                    client: supplier.contact || "",
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    supplier_id: selectedSupplierId,
                  }));
                }
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* 품목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              품목 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* 단위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              단위 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit_id}
              onChange={(e) => handleInputChange("unit_id", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">선택해주세요</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(formData.quantity) || ""}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 단가 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                단가{isVatIncluded ? "(VAT 포함)" : "(VAT 별도)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleVatToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isVatIncluded ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`${
                      isVatIncluded ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
                <span className="ml-2 text-sm text-gray-500">
                  {isVatIncluded ? "VAT 포함" : "VAT 별도"}
                </span>
              </div>
            </div>
            <input
              type="text"
              name="price"
              value={formatNumber(formData.price) || ""}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            />
          </div>

          {/* 총액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              총액{isVatIncluded ? "(VAT 포함)" : "(VAT 별도)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(formData.total) || ""}
              onChange={(e) => handleInputChange("total", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
              readOnly
            />
          </div>

          {/* 결제주기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              결제주기 <span className="text-red-500">*</span>
            </label>
            <select
              value={
                formData.payment_cycle === ""
                  ? "미정"
                  : showDaySelect
                  ? "기타입력"
                  : formData.payment_cycle
              }
              onChange={(e) => handlePaymentCycleChange(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              {paymentCycles.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
            {showDaySelect && (
              <Select
                value={{
                  value: formData.payment_cycle,
                  label: `${formData.payment_cycle}일`,
                }}
                onChange={(option) => {
                  if (option) {
                    setFormData((prev) => ({
                      ...prev,
                      payment_cycle: option.value,
                    }));
                  }
                }}
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: `${i + 1}일`,
                }))}
                className="mt-2 text-black"
                classNamePrefix="select"
                placeholder="날짜 선택"
                isSearchable
              />
            )}
          </div>

          {/* 결제유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              결제유형 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) =>
                handleInputChange("payment_method", e.target.value)
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
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
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
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
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
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
    </Modal>
  );
}
