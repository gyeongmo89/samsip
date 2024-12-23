"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Heart } from "lucide-react";

  /**
   * @description Navigation bar component.
   * @returns {JSX.Element}
   */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageClickCount, setImageClickCount] = useState(0);
  const [nameClickCount, setNameClickCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const checkLoginStatus = () => {
      if (typeof window !== 'undefined') {
        const loggedIn = !!localStorage.getItem("isLoggedIn");
        const username = localStorage.getItem("username") || '';
        setIsLoggedIn(loggedIn);
        setCurrentUser(username);
      }
    };

    // Check initial status
    checkLoginStatus();

    // Add event listener for storage changes
    window.addEventListener('storage', checkLoginStatus);

    // Add custom event listener for login status changes
    window.addEventListener('loginStatusChanged', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('loginStatusChanged', checkLoginStatus);
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-gray-700/50 text-white"
      : "text-gray-300 hover:bg-gray-700/50 hover:text-white";
  };

  const handleImageClick = () => {
    setImageClickCount(prev => prev + 1);
  };

  const handleNameClick = () => {
    setNameClickCount(prev => prev + 1);
  };

  useEffect(() => {
    if (imageClickCount === 7) {
      setMessage("희주야 사랑해");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 5000);
      setImageClickCount(0);
    }
  }, [imageClickCount]);

  useEffect(() => {
    if (nameClickCount === 7) {
      setMessage("화이팅! 힘내!!");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 5000);
      setNameClickCount(0);
    }
  }, [nameClickCount]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/";
    }
  };

  return (
    <nav className="bg-gradient-to-r from-purple-950 via-blue-900 to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div>
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
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform  ${isActive(
                      "/orders"
                    )}`}
                  >
                    발주 관리
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
                  <Link
                    href="/dashboard"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/dashboard"
                    )}`}
                  >
                    통계 현황
                  </Link>
                  <Link
                    href="/formDownload"
                    className={`text-white hover:bg-green-400 hover:text-black rounded-md px-3 py-2 text-md font-medium transition-colors hover:scale-110 transform ${isActive(
                      "/formDownload"
                    )}`}
                  >
                    양식 다운로드
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-8">
              {isLoggedIn ? (
                <>
                  <div className={`cursor-${currentUser === 'jieun' ? 'default' : 'default'}`}>
                    <Image
                      src={currentUser === 'jieun' ? "/jieun.png" : "/heeju.jpeg"}
                      alt="avatar"
                      width={40}
                      height={40}
                      className="ml-2 rounded-full object-cover"
                      onClick={currentUser === 'jieun' ? undefined : handleImageClick}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-white text-sm ml-2 cursor-default" onClick={currentUser === 'jieun' ? undefined : handleNameClick}>
                      {currentUser === 'jieun' ? '이지은 대표' : '박희주 매니저'}
                    </div>
                    <div>
                      <button
                        onClick={handleLogout}
                        className="text-white align-middle hover:text-red-400 transition-colors"
                        title="로그아웃"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-[200px] h-[40px]"></div>
              )}
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

      {showMessage && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="text-6xl font-bold text-white animate-bounce flex flex-col items-center">
            {message}
            {message === "희주야 사랑해" && <Heart className="text-red-500 w-24 h-24 mt-4 animate-pulse" />}
            <div className="mt-8 w-full h-full absolute top-0 left-0 flex items-center justify-center">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-firework"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  🎉
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <style jsx>{`
        @keyframes firework {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(var(--x), var(--y)); opacity: 0; }
        }
        .animate-firework {
          --x: random(-50px, 50px);
          --y: random(-50px, 50px);
          animation: firework 2s ease-out infinite;
        }
      `}</style>
    </nav>
  );
}
