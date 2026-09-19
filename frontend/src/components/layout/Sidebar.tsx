/**
 * Sidebar — Clean Navigation Panel.
 *
 * Light Mode (#FFFFFF background with #E2E8F0 right border)
 * Primary Brand: StartupSetu
 */

import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { navigationConfig } from "@/data/navigation";
import type { UserRole } from "@/types";
import {
  LayoutDashboard,
  Target,
  Search,
  FileText,
  FlaskConical,
  BarChart3,
  ShoppingCart,
  Brain,
  FileBarChart,
  Shield,
  Settings,
  Building,
  Building2,
  Users,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sliders,
} from "lucide-react";

/** Icon lookup mapping */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Target,
  Search,
  FileText,
  FlaskConical,
  BarChart3,
  ShoppingCart,
  Brain,
  FileBarChart,
  Shield,
  Settings,
  Building,
  Building2,
  Users,
  ClipboardCheck,
  Sliders,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const role: UserRole = user?.role || "GOVERNMENT_OFFICER";
  const navGroups = navigationConfig[role] || [];

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 select-none fixed left-0 top-0 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Sidebar Header & Clean Product Branding */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Simple Geometric Product Mark */}
            <div className="w-8 h-8 rounded-md bg-blue-900 text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-blue-300" />
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-extrabold text-slate-900 truncate tracking-tight">
                  StartupSetu
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items Grouped */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-7rem)]">
          {navGroups.map((group) => (
            <div key={group.groupName}>
              {!collapsed && (
                <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {group.groupName}
                </h4>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = iconMap[item.iconName] || Target;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group relative",
                          isActive
                            ? "bg-blue-50 text-blue-900 font-bold border-r-2 border-blue-700"
                            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0 transition-colors",
                              isActive
                                ? "text-blue-700"
                                : "text-slate-500 group-hover:text-slate-700"
                            )}
                          />

                          {!collapsed && (
                            <span className="truncate flex-1">{item.label}</span>
                          )}

                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-0.2 rounded",
                                isActive
                                  ? "bg-blue-700 text-white"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}

                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              {item.label}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Collapse Button when Collapsed */}
      <div className="p-2 border-t border-slate-200">
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
