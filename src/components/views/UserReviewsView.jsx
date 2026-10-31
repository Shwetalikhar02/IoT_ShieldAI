import React, { useState, useEffect } from 'react'
import {
  Star,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Sparkles
} from 'lucide-react'
import { reviewsApi } from '../../services/api'

export default function UserReviewsView({ currentUser }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ total: 0, averageRating: 5.0, distribution: {} })
  const [loading, setLoading] = useState(true)

  // Form State
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('Overall Experience')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)

  const categories = [
    'Overall Experience',
    'User Experience',
    'AI Assistant',
    'Vulnerability Detection',
    'Code Fixing',
    'Verification'
  ]

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await reviewsApi.getCommunityReviews()
      setReviews(data.reviews || [])
      setStats(data.stats || { total: 0, averageRating: 5.0, distribution: {} })
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !feedback.trim()) {
      setError('Please provide both a title and written feedback.')
      return
    }

    setSubmitting(true)
    try {
      if (editingReviewId) {
        await reviewsApi.updateReview(editingReviewId, { rating, title, feedback, category })
        setSuccess('Your review was successfully updated!')
        setEditingReviewId(null)
      } else {
        await reviewsApi.createReview(rating, title, feedback, category)
        setSuccess('Thank you! Your feedback has been published.')
      }

      setTitle('')
      setFeedback('')
      setRating(5)
      await loadReviews()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err?.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (r) => {
    setEditingReviewId(r.id)
    setRating(r.rating)
    setTitle(r.title)
    setFeedback(r.feedback)
    setCategory(r.category || 'Overall Experience')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove your review?')) return
    try {
      await reviewsApi.deleteReview(id)
      await loadReviews()
    } catch (err) {
      alert(err?.message || 'Failed to delete review.')
    }
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Reviews & Community Feedback
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Real user reviews, developer evaluations, and feedback on CodeShield AI firmware defense.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#9AA39B]">
              Total Reviews: <strong className="text-[#B7E36A]">{stats.total}</strong>
            </span>
          </div>
        </div>

        {/* Rating Breakdown & Stats Card */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#2B332D] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Average Score */}
          <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-[#2B332D] pb-4 md:pb-0">
            <div className="text-4xl font-extrabold text-[#F3F5EF] font-mono">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 text-[#E5A854]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-[#E5A854] text-[#E5A854]'
                      : 'text-[#2B332D]'
                  }`}
                />
              ))}
            </div>
            <div className="text-[11px] text-[#9AA39B]">
              Based on {stats.total} verified developer reviews
            </div>
          </div>

          {/* Star Distribution Histogram */}
          <div className="col-span-2 space-y-1.5 font-mono text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.distribution?.[stars] || 0
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-12 text-[#9AA39B] flex items-center gap-1 text-[11px]">
                    {stars} <Star className="w-3 h-3 fill-[#E5A854] text-[#E5A854]" />
                  </span>
                  <div className="flex-1 bg-[#101310] h-2 rounded-full overflow-hidden border border-[#2B332D]">
                    <div
                      className="bg-[#B7E36A] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-[11px] text-[#626D64]">
                    {count} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit Review Card */}
        <div className="p-6 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2B332D]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#B7E36A]" />
              <h3 className="font-bold text-sm text-[#F3F5EF]">
                {editingReviewId ? 'Edit Your Review' : 'Submit Developer Feedback'}
              </h3>
            </div>
            {editingReviewId && (
              <button
                onClick={() => {
                  setEditingReviewId(null)
                  setTitle('')
                  setFeedback('')
                }}
                className="text-[11px] text-[#9AA39B] hover:text-[#F3F5EF] underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#F07878]/10 border border-[#F07878]/30 flex items-center gap-2 text-[#F07878]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-[#B7E36A]/10 border border-[#B7E36A]/30 flex items-center gap-2 text-[#B7E36A]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Interactive Stars */}
            <div>
              <label className="block text-[11px] text-[#9AA39B] mb-1 font-medium">Rating Score</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating || rating)
                          ? 'fill-[#E5A854] text-[#E5A854]'
                          : 'text-[#2B332D]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono text-[#9AA39B] ml-2">
                  {rating === 5 && 'Outstanding (5/5)'}
                  {rating === 4 && 'Very Good (4/5)'}
                  {rating === 3 && 'Average (3/5)'}
                  {rating === 2 && 'Needs Improvement (2/5)'}
                  {rating === 1 && 'Unsatisfactory (1/5)'}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-[#9AA39B] mb-1 font-medium">Feedback Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#9AA39B] mb-1 font-medium">Review Headline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robust memory-safety checking on Cortex-M"
                  required
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
                />
              </div>
            </div>

            {/* Written Feedback */}
            <div>
              <label className="block text-[11px] text-[#9AA39B] mb-1 font-medium">Detailed Feedback & Experience</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with the vulnerability detection, AddressSanitizer checks, or Gemini AI assistant..."
                rows={3}
                required
                className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2.5 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A] leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-lime text-xs font-semibold py-2 px-5 flex items-center gap-1.5"
              >
                {submitting ? (
                  <span className="cs-spinner" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingReviewId ? 'Update Review' : 'Publish Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Community Reviews Feed */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#F3F5EF]">Recent Developer Reviews</h3>

          {loading ? (
            <div className="p-8 text-center text-[#9AA39B]">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#181D19] border border-[#2B332D] text-center text-[#9AA39B]">
              No reviews published yet. Be the first developer to share your feedback!
            </div>
          ) : (
            reviews.map((r) => {
              const isOwner = currentUser?.id && r.userId === currentUser.id

              return (
                <div
                  key={r.id}
                  className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#F3F5EF]">{r.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#101310] text-[#B7E36A] border border-[#2B332D]">
                          {r.category || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9AA39B]">
                        <div className="flex text-[#E5A854]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating ? 'fill-[#E5A854]' : 'text-[#2B332D]'
                              }`}
                            />
                          ))}
                        </div>
                        <span>·</span>
                        <span className="font-medium text-[#F3F5EF]">{r.userName}</span>
                        <span>·</span>
                        <span className="text-[#626D64] font-mono text-[10px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(r)}
                          className="p-1 rounded text-[#9AA39B] hover:text-[#F3F5EF]"
                          title="Edit your review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 rounded text-[#9AA39B] hover:text-[#F07878]"
                          title="Delete your review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#9AA39B] leading-relaxed font-sans">
                    {r.feedback}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
