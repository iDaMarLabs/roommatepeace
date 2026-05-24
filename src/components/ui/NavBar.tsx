'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, CheckSquare, Receipt, BookOpen, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/chores', label: 'Chores', icon: CheckSquare },
  { href: '/bills', label: 'Bills', icon: Receipt },
  { href: '/rules', label: 'Rules', icon: BookOpen },
]

export default function NavBar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4">
        {/* Title row */}
        <div className="flex items-center justify-between h-12">
          <div className="w-10" />
          <Link
            href="/dashboard"
            className="flex flex-col items-center hover:text-emerald-600 transition-colors group"
          >
            <span className="text-lg font-bold text-stone-900 group-hover:text-emerald-600 transition-colors leading-tight">
              Roommate Peace
              <span className="hidden sm:inline text-stone-400 font-normal text-sm">
                {' '}— End roommate arguments
              </span>
            </span>
            <span className="sm:hidden text-xs text-stone-400 font-normal leading-none">
              End roommate arguments
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-stone-500 hover:text-red-500 text-sm transition-colors p-1.5 rounded-lg hover:bg-red-50"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>

        {/* Nav row */}
        <div className="grid grid-cols-4 border-t border-stone-100">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                pathname === href
                  ? 'text-emerald-600'
                  : 'text-stone-500 hover:text-stone-900'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
