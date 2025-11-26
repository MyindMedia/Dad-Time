import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import wordmark from '../../assets/dad_time_horizontal_logo.svg'
import { supabase, SUPABASE_CONFIG_OK } from '../lib/supabase'
import {
  HomeIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Timer', href: '/timer', icon: ClockIcon },
  { name: 'GPS Tracking', href: '/gps-tracking', icon: MapPinIcon },
  { name: 'Expenses', href: '/expenses', icon: CurrencyDollarIcon },
  { name: 'AI Conversations', href: '/ai-conversations', icon: ChatBubbleLeftRightIcon },
  { name: 'Evidence', href: '/evidence', icon: DocumentDuplicateIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src={wordmark} alt="Dad Time" className="h-20 object-contain" />
            </div>
            <button
              type="button"
              className="-m-2.5 p-2.5"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-900" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col p-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`${
                          location.pathname === item.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        } group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 w-full"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-2">
              <img src={wordmark} alt="Dad Time" className="h-20 object-contain" />
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`${
                          location.pathname === item.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        } group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 w-full"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-40 flex h-24 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 lg:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <img src={wordmark} alt="Dad Time" className="h-20 object-contain" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">
            {!SUPABASE_CONFIG_OK && (
              <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                Supabase is not configured. Set environment variables on your host: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
