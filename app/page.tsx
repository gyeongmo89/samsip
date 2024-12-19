'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'
// import Dashboard from '@/components/Dashboard'

export default function Home() {
  const router = useRouter()
  const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') === 'true' : false

  useEffect(() => {
    if (isLoggedIn) {
      // router.push('/dashboard')
      router.push('/orders')
    }
  }, [isLoggedIn, router])

  return <LoginForm />
}
