'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, CheckSquare, Receipt, BookOpen, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HouseholdMember } from '@/types'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/chores', label: 'Chores', icon: CheckSquare },
  { href: '/bills', label: 'Bills', icon: Receipt },
  { href: '/rules', label: 'Rules', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface NavBarProps {
  userEmail: string
  currentUserId: string
  members: HouseholdMember[]
}

export default function NavBar({ userEmail, currentUserId, members }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Title row */}
        <div className="flex items-center justify-between h-12">
          <div className="w-10" />
          <Link
            href="/"
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
        <div className="grid grid-cols-5 border-t border-stone-100">
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

        {/* Members strip */}
        {members.length > 0 && (
          <div className="flex items-center gap-3 py-2 border-t border-stone-100 overflow-x-auto">
            <span className="text-xs text-stone-400 shrink-0">Household:</span>
            {members.map((m) => {
              const isMe = m.user_id === currentUserId
              const name = isMe
                ? 'You'
                : (m.profile?.name ?? m.profile?.email?.split('@')[0] ?? 'Roommate')
              const initial = name[0].toUpperCase()
              return (
                <span key={m.id} className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      isMe ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {initial}
                  </span>
                  <span className={`text-xs ${isMe ? 'text-emerald-700 font-medium' : 'text-stone-600'}`}>
                    {name}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
