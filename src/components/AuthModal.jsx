import React, { useState } from 'react'
import {
  Shield,
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { authApi } from '../services/api'

export default function AuthModal({
  isOpen,
  initialMode = 'login', // 'login' | 'signup' | 'reset'
  onClose,
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Too short', color: 'bg-zinc-700' }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-[#F07878]' }
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-[#E5A854]' }
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-[#78B3E0]' }
    return { score: 100, label: 'Strong', color: 'bg-[#B7E36A]' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.')
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        if (!agreeTerms) throw new Error('You must agree to the Terms and Privacy terms.')

        const res = await authApi.register(name, email, password, confirmPassword)
        setSuccessMsg('Account created successfully!')
        onAuthSuccess(res.user)
      } else if (mode === 'login') {
        const res = await authApi.login(email, password)
        setSuccessMsg('Logged in successfully!')
        onAuthSuccess(res.user)
      } else if (mode === 'reset') {
        if (!email.trim() || !password) throw new Error('Email and new password are required.')
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        const res = await authApi.resetPassword(email, password)
        setSuccessMsg(res.message || 'Password reset successfully.')
        setTimeout(() => setMode('login'), 1500)
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login('demo@codeshield.ai', 'ShieldDemo2026!')
      onAuthSuccess(res.user)
    } catch (err) {
      setError(err?.message || 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-xs">
      <div className="w-full max-w-md bg-[#181D19] border border-[#2B332D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-[#2B332D] flex items-center justify-between bg-[#1D231E]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#101310] border border-[#2B332D] flex items-center justify-center text-[#B7E36A]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F3F5EF]">
                {mode === 'login' && 'Sign in to CodeShield'}
                {mode === 'signup' && 'Create Developer Account'}
                {mode === 'reset' && 'Reset Account Password'}
              </h3>
              <p className="text-[11px] text-[#9AA39B]">IoT Firmware Security Workbench</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#2B332D]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#F07878]/10 border border-[#F07878]/30 flex items-start gap-2 text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-[#B7E36A]/10 border border-[#B7E36A]/30 flex items-start gap-2 text-[#B7E36A]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#626D64] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full bg-[#101310] border border-[#2B332D] rounded-lg py-2 pl-9 pr-3 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]/60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#626D64] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@firmware.io"
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg py-2 pl-9 pr-3 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]/60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-[#9AA39B]">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); }}
                    className="text-[10px] text-[#B7E36A] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#626D64] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg py-2 pl-9 pr-9 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#626D64] hover:text-[#9AA39B]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Strength Meter in Signup */}
              {mode === 'signup' && password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[#9AA39B]">
                    <span>Password Strength</span>
                    <span>{strength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-[#101310] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#626D64] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#101310] border border-[#2B332D] rounded-lg py-2 pl-9 pr-3 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]/60 font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <label className="flex items-start gap-2 pt-1 text-[11px] text-[#9AA39B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#2B332D] bg-[#101310] text-[#B7E36A] focus:ring-0"
                />
                <span>I agree to the CodeShield Terms of Service and Privacy Policy.</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-lime py-2 font-semibold text-xs flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="cs-spinner" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Reset Password'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-2 border-t border-[#2B332D] text-center space-y-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full btn-quiet py-1.5 text-xs text-[#B7E36A] hover:border-[#B7E36A]/50 flex items-center justify-center gap-1.5"
            >
              <span>Instant Demo Account (demo@codeshield.ai)</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="text-center text-[11px] text-[#9AA39B] pt-1">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-[#B7E36A] font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-[#B7E36A] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
