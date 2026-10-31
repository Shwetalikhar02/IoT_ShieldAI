import React from 'react'
import {
  Shield,
  LayoutDashboard,
  Code2,
  AlertCircle,
  Wand2,
  CheckCircle2,
  FileText,
  Settings,
  Flame,
  BarChart3
} from 'lucide-react'

export default function NavigationSidebar({
  activeView = 'explorer',
  onSelectView,
  vulnCount = 0,
  verifiedCount = 0
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Firmware Explorer', icon: Code2 },
    {
      id: 'findings',
      label: 'Vulnerabilities',
      icon: AlertCircle,
      badge: vulnCount > 0 ? vulnCount : null,
      badgeColor: 'text-[#F07878] bg-[#F07878]/10'
    },
    { id: 'repair', label: 'AI Repair', icon: Wand2 },
    {
      id: 'verify',
      label: 'Verification',
      icon: CheckCircle2,
      badge: verifiedCount > 0 ? `${verifiedCount}✓` : null,
      badgeColor: 'text-[#B7E36A] bg-[#B7E36A]/10'
    },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-60 h-full bg-[#101310] border-r border-[#2B332D] flex flex-col justify-between select-none shrink-0 z-30">
      {/* Top Brand Mark */}
      <div>
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-[#2B332D]">
          <div className="w-7 h-7 rounded-md bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[#B7E36A]">
            <Shield className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-[#F3F5EF] leading-tight">
              CodeShield AI
            </span>
            <span className="text-[10px] text-[#9AA39B] font-mono tracking-wider">
              FIRMWARE DEFENSE
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#181D19] text-[#F3F5EF] border border-[#2B332D]'
                    : 'text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#B7E36A] rounded-r" />
                )}

                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#B7E36A]' : 'text-[#9AA39B] group-hover:text-[#F3F5EF]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Status & System Info */}
      <div className="p-3 border-t border-[#2B332D]">
        <div className="p-2.5 rounded-lg bg-[#181D19] border border-[#2B332D] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9AA39B]">Analysis Sandbox</span>
            <span className="font-mono text-[10px] text-[#B7E36A] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7E36A]" />
              Isolated
            </span>
          </div>
          <div className="text-[10px] text-[#626D64] font-mono leading-relaxed">
            ASan + UBSan · QEMU ready
          </div>
        </div>
      </div>
    </aside>
  )
}
