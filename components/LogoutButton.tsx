'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()

    // force refresh and redirect
    router.push('/auth')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
    >
      Logout
    </button>
  )
}