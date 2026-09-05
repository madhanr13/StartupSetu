/**
 * UserMenu — Institutional User Profile & Role Dropdown.
 */

import { useAuth } from "@/context/AuthContext";
import { roleLabels, roleColors } from "@/data/navigation";
import Dropdown from "@/components/ui/Dropdown";
import { User, Settings, LogOut, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/types";

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const role: UserRole = user.role || "GOVERNMENT_OFFICER";
  const roleLabel = roleLabels[role] || role;
  const colors = roleColors[role] || { bg: "bg-blue-50", text: "text-blue-900", border: "border-blue-200" };

  const trigger = (
    <div className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-slate-100/80 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center border border-blue-950 shadow-2xs">
        {initials}
      </div>
      <div className="hidden sm:flex flex-col text-left">
        <span className="text-xs font-bold text-slate-900 leading-tight">
          {user.name}
        </span>
        <span className="text-[10px] text-slate-500 font-medium leading-tight">
          {user.department_name || roleLabel}
        </span>
      </div>
    </div>
  );

  const dropdownHeader = (
    <div className="p-3 border-b border-slate-100 bg-slate-50/70">
      <p className="text-xs font-bold text-slate-900">{user.name}</p>
      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
      {user.department_name && (
        <p className="text-[10px] text-slate-600 font-semibold mt-1">
          🏛️ {user.department_name}
        </p>
      )}
      <div className="mt-2">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          <ShieldCheck className="w-3 h-3" />
          {roleLabel}
        </span>
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={trigger}
      align="right"
      items={[
        {
          label: "View Profile",
          icon: <User className="w-4 h-4 text-slate-500" />,
          onClick: () => {},
        },
        {
          label: "Platform Settings",
          icon: <Settings className="w-4 h-4 text-slate-500" />,
          onClick: () => {},
        },
        {
          label: "Sign Out",
          icon: <LogOut className="w-4 h-4 text-rose-600" />,
          danger: true,
          onClick: logout,
        },
      ]}
    >
      {dropdownHeader}
    </Dropdown>
  );
}
