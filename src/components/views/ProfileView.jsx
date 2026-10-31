import React, { useState } from 'react'
import {
  User,
  Mail,
  Calendar,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  FolderGit2,
  LogOut
} from 'lucide-react'
import { authApi } from '../../services/api'

export default function ProfileView({
  currentUser,
  projects = [],
  onUpdateUser,
  onLogout
}) {
  const [name, setName] = useState(currentUser?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' })
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingProfile(true)
    setProfileMsg({ text: '', type: '' })
    try {
      const res = await authApi.updateProfile(name.trim())
      onUpdateUser(res.user)
      setProfileMsg({ text: 'Profile name updated successfully.', type: 'success' })
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000)
    } catch (err) {
      setProfileMsg({ text: err?.message || 'Failed to update profile.', type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters.', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    setChangingPassword(true)
    setPasswordMsg({ text: '', type: '' })
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setPasswordMsg({ text: 'Password changed successfully.', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3000)
    } catch (err) {
      setPasswordMsg({ text: err?.message || 'Failed to change password.', type: 'error' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      await authApi.deleteAccount('DELETE')
      onLogout()
    } catch (err) {
      alert(err?.message || 'Failed to delete account.')
    }
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              User Profile & Account
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Manage your developer credentials, security session, and personal settings.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="btn-quiet text-xs !text-[#F07878] hover:border-[#F07878]/50 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Identity Overview Card */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#2B332D] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#101310] border border-[#2B332D] flex items-center justify-center text-xl font-bold text-[#B7E36A] font-mono shadow-inner">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#F3F5EF]">{currentUser?.name || 'Engineer'}</h2>
              <div className="flex items-center gap-2 text-[11px] text-[#9AA39B] font-mono">
                <Mail className="w-3 h-3 text-[#626D64]" />
                <span>{currentUser?.email}</span>
                <span>·</span>
                <Calendar className="w-3 h-3 text-[#626D64]" />
                <span>Joined {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="badge-verified-subtle text-[11px]">Active Session</span>
            <div className="text-[10px] text-[#626D64] mt-1">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} Registered
            </div>
          </div>
        </div>

        {/* Edit Profile Name Form */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <User className="w-4 h-4 text-[#B7E36A]" />
            <h3 className="font-bold text-sm text-[#F3F5EF]">Personal Information</h3>
          </div>

          {profileMsg.text && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-[#B7E36A]/10 border-[#B7E36A]/30 text-[#B7E36A]'
                  : 'bg-[#F07878]/10 border-[#F07878]/30 text-[#F07878]'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-[11px] text-[#9AA39B] mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2.5 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9AA39B] mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2.5 text-xs text-[#626D64] opacity-75 font-mono cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingProfile || !name.trim()}
                className="btn-lime text-xs font-semibold py-2 px-4"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <Lock className="w-4 h-4 text-[#B7E36A]" />
            <h3 className="font-bold text-sm text-[#F3F5EF]">Change Account Password</h3>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-[#B7E36A]/10 border-[#B7E36A]/30 text-[#B7E36A]'
                  : 'bg-[#F07878]/10 border-[#F07878]/30 text-[#F07878]'
              }`}
            >
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 font-mono">
            <div>
              <label className="block text-[11px] text-[#9AA39B] mb-1 font-sans">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#9AA39B] mb-1 font-sans">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#9AA39B] mb-1 font-sans">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="btn-lime text-xs font-semibold py-2 px-4 font-sans"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#F07878]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#F07878]">Danger Zone: Delete Account</h3>
              <p className="text-xs text-[#9AA39B] mt-0.5">
                Permanently purge your account, all uploaded firmware repositories, and verification history.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-quiet text-xs !text-[#F07878] hover:border-[#F07878]"
            >
              Delete Account...
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#181D19] border border-[#F07878]/40 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-[#F07878]">Confirm Irreversible Account Deletion</h3>
            <p className="text-xs text-[#9AA39B] leading-relaxed">
              This will permanently delete your account and all associated firmware projects. Type <strong>DELETE</strong> below to proceed:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[#101310] border border-[#2B332D] rounded p-2 text-xs text-[#F07878] font-mono focus:outline-none focus:border-[#F07878]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="btn-quiet text-xs"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="btn-lime text-xs font-semibold !bg-[#F07878] !text-white disabled:opacity-40"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
