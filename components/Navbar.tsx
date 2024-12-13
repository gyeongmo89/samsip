"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-gray-700/50 text-white"
      : "text-gray-300 hover:bg-gray-700/50 hover:text-white";
  };

  return (
    <nav className="bg-gradient-to-r from-purple-950 via-blue-900 to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* <div className="flex h-16 items-center justify-between"> */}
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div>
              {/* <Link href="/" className="flex-shrink-0"> */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/samLogo.jpeg"
                  alt="삼십일미 로고"
                  width={40}
                  height={40}
                  className="mr-2 rounded-full object-cover"
                />

                <h1 className="text-white text-xl font-bold">
                  삼십일미 발주관리 시스템
                </h1>
              </Link>
            </div>
            <div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    href="/orders"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/orders"
                    )}`}
                  >
                    발주관리
                  </Link>
                  <Link
                    href="/supplier"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/supplier"
                    )}`}
                  >
                    구입처 관리
                  </Link>
                  <Link
                    href="/items"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/items"
                    )}`}
                  >
                    품목 관리
                  </Link>
                  <Link
                    href="/units"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/units"
                    )}`}
                  >
                    단위 관리
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-8">
              <div>
                <Image
                  src="/heeju.jpeg"
                  alt="avatar"
                  width={40}
                  height={40}
                  className="ml-2 rounded-full object-cover"
                />
              </div>
              <div  className="flex items-center gap-4">
                <div className="text-white text-sm ml-2">박희주 매니저</div>
                <div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('isLoggedIn')
                      window.location.href = '/'
                    }}
                    className="text-white align-middle hover:text-red-400 transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-gray-800/50 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`${isOpen ? "block" : "hidden"} md:hidden`}>
        <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
          <Link
            href="/stats"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/stats"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            통계
          </Link>
          <Link
            href="/orderlist"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/orderlist"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            주문 목록
          </Link>
          <Link
            href="/orders"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/orders"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            주문등록
          </Link>
          <Link
            href="/supplier"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/supplier"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            구입처 등록
          </Link>
          <Link
            href="/items"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/items"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            품목 등록
          </Link>
          <Link
            href="/units"
            className={`text-gray-300 hover:bg-gray-700/50 hover:text-white block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(
              "/units"
            )}`}
            onClick={() => setIsOpen(false)}
          >
            단위 등록
          </Link>
        </div>
      </div>
    </nav>
  );
}
