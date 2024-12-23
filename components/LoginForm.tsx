"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (username === "heeju" && password === "rudahtkfkd") ||
      (username === "jieun" && password === "admin")
    ) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username); // Store the username
      // Dispatch custom event for login status change
      window.dispatchEvent(new Event("loginStatusChanged"));
      router.push("/orders");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-4">
            <Image
              src="/samLogo.jpeg"
              alt="삼십일미 로고"
              width={60}
              height={60}
              className="rounded-full"
            />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              삼십일미 발주관리 시스템
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              아이디
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
          >
            로그인
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
          <div>The copyright of this system belongs to Kimgyongmo.</div>
          <div>Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
}
