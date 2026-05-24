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
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-stone-900 text-sm tracking-tight">
            Roommate Peace
          </span>
          <div className="flex items-center gap-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  pathname === href
                    ? 'text-emerald-600 font-medium'
                    : 'text-stone-500 hover:text-stone-900'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm transition-colors"
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
