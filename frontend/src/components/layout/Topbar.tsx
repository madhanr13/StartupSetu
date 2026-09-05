/**
 * Topbar — Institutional Header Component.
 *
 * Requirements:
 * - Light Mode (#FFFFFF background with #E2E8F0 bottom border)
 * - Path Breadcrumbs
 * - Global Search Bar
 * - Notifications & Help Guides
 * - User Menu & Role Badge
 */

import { Menu, Search, HelpCircle } from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import NotificationMenu from "@/components/layout/NotificationMenu";
import UserMenu from "@/components/layout/UserMenu";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Breadcrumb />
      </div>

      {/* Center/Right: Global Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search challenges, startups, pilots..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Help & Guide */}
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors relative"
          title="Procurement Guidelines & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <NotificationMenu />

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
