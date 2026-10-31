import React from 'react'
import {
  Shield,
  LayoutDashboard,
  FolderGit2,
  PlusCircle,
  Code2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Zap,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Cpu
} from 'lucide-react'

export default function NavigationSidebar({
  activeView = 'overview',
  onSelectView,
  vulnCount = 0,
  verifiedCount = 0,
  currentUser = null,
  activeProject = null,
  onCreateProject,
  onOpenBenchmark,
  onOpenCheatingDemo,
  onRunPipeline,
  onLogout
}) {
  const sections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'projects', label: 'My Projects', icon: FolderGit2 },
        { id: 'create_project', label: 'Create New Project', icon: PlusCircle, isAction: true },
        { id: 'explorer', label: 'Firmware Explorer', icon: Code2 },
      ]
    },
    {
      title: 'SECURITY',
      items: [
        { id: 'findings', label: 'Vulnerability Findings', icon: AlertCircle, badge: vulnCount > 0 ? vulnCount : null, badgeColor: 'text-[#F07878] bg-[#F07878]/10' },
        { id: 'repair', label: 'AI Code Review', icon: ShieldCheck },
        { id: 'assistant', label: 'AI Assistant', icon: Sparkles, badge: 'AI', badgeColor: 'text-[#B7E36A] bg-[#B7E36A]/10' },
        { id: 'cheating_check', label: 'Integrity Checks', icon: Shield, isAction: true },
      ]
    },
    {
      title: 'VALIDATION',
      items: [
        { id: 'verify', label: 'Verification Console', icon: CheckCircle2, badge: verifiedCount > 0 ? `${verifiedCount}✓` : null, badgeColor: 'text-[#B7E36A] bg-[#B7E36A]/10' },
        { id: 'benchmark', label: 'Benchmark Suite', icon: BarChart3, isAction: true },
        { id: 'pipeline', label: 'Full Pipeline', icon: Zap, isAction: true },
        { id: 'reports', label: 'Security Health Report', icon: LayoutDashboard },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'reviews', label: 'Reviews & Feedback', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    }
  ]

  const handleItemClick = (item) => {
    if (item.id === 'create_project') {
      onCreateProject?.()
      return
    }
    if (item.id === 'benchmark') {
      onOpenBenchmark?.()
      return
    }
    if (item.id === 'cheating_check') {
      onOpenCheatingDemo?.()
      return
    }
    if (item.id === 'pipeline') {
      onRunPipeline?.()
      return
    }
    onSelectView(item.id)
  }

  return (
    <aside className="w-60 h-full bg-[#101310] border-r border-[#2B332D] flex flex-col justify-between select-none shrink-0 z-30">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#2B332D] bg-[#101310]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[#B7E36A]">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[#F3F5EF] leading-tight">
                CodeShield AI
              </span>
              <span className="text-[9px] text-[#9AA39B] font-mono tracking-wider">
                FIRMWARE DEFENSE
              </span>
            </div>
          </div>
        </div>

        {/* Active Project Ribbon */}
        {activeProject && (
          <div className="px-3 py-2 border-b border-[#2B332D] bg-[#181D19]/40">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#9AA39B]">
              <span className="text-[#626D64] uppercase font-sans">Active Project:</span>
              <span className="text-[#B7E36A] font-semibold truncate max-w-[110px]" title={activeProject.name}>
                {activeProject.name}
              </span>
            </div>
          </div>
        )}

        {/* Categorized Navigation */}
        <nav className="p-2.5 space-y-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#626D64]">
                {sec.title}
              </div>

              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-[#181D19] text-[#F3F5EF] border border-[#2B332D]'
                        : 'text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#B7E36A] rounded-r" />
                    )}

                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-[#B7E36A]' : 'text-[#626D64] group-hover:text-[#F3F5EF]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#2B332D] bg-[#101310]">
        <div className="p-2 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between">
          <div
            onClick={() => onSelectView('profile')}
            className="flex items-center gap-2 cursor-pointer overflow-hidden flex-1"
          >
            <div className="w-6 h-6 rounded-full bg-[#1D231E] border border-[#2B332D] flex items-center justify-center text-[11px] font-mono text-[#B7E36A] font-bold shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-[#F3F5EF] truncate">
                {currentUser?.name || 'Engineer'}
              </div>
              <div className="text-[10px] text-[#626D64] truncate font-mono">
                {currentUser?.email || 'authenticated'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1 rounded text-[#9AA39B] hover:text-[#F07878] transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
