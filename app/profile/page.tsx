'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACTIVITIES: string[] = [
  'Outdoors', 'Art & culture', 'Food & drink', 'Music',
  'Markets', 'Walks & hikes', 'Sports', 'Nightlife', 'Photography', 'History'
]

const FOODS: string[] = [
  'Street food', 'Fine dining', 'Coffee shops', 'Vegan / veg',
  'Brunch spots', 'Ethnic cuisines', 'Cocktail bars', 'Hidden gems'
]

const TIMES: { label: string; sub: string }[] = [
  { label: 'Morning', sub: '6 AM – 12 PM' },
  { label: 'Afternoon', sub: '12 PM – 5 PM' },
  { label: 'Evening', sub: '5 PM – 10 PM' },
  { label: 'Night', sub: '10 PM – late' },
]

const BUDGETS: string[] = ['Free only', 'Under $25', 'Under $50', 'No limit']
const DURATIONS: string[] = ['30 minutes', '1 hour', '2 hours', 'Half day', 'No limit']
const DISTANCES: string[] = ['Within 0.5 miles', 'Within 1 mile', 'Within 3 miles', 'Anywhere in the city']

interface FormState {
  full_name: string
  neighborhood: string
  city: string
  distance: string
  activities: string[]
  foods: string[]
  times: string[]
  budget: string
  duration: string
}

interface NeighborhoodSuggestion {
  name: string
  reason: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState<NeighborhoodSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    full_name: '',
    neighborhood: '',
    city: '',
    distance: 'Within 1 mile',
    activities: [],
    foods: [],
    times: [],
    budget: 'Under $25',
    duration: '2 hours',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error_description') || params.get('error')
    if (err) {
      setAuthError(decodeURIComponent(err.replace(/\+/g, ' ')))
      setLoading(false)
      return
    }
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser({ id: user.id, email: user.email })

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          neighborhood: profile.neighborhood || '',
          city: profile.city || '',
          distance: profile.max_distance || 'Within 1 mile',
          activities: profile.preferred_activities || [],
          foods: profile.preferred_foods || [],
          times: profile.available_times || [],
          budget: profile.budget || 'Under $25',
          duration: profile.max_duration || '2 hours',
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNeighborhoodSuggestions() {
    if (!form.city.trim()) {
      setSuggestionError('Please enter a city first')
      return
    }
    setLoadingSuggestions(true)
    setSuggestionError(null)
    setNeighborhoodSuggestions([])

    try {
      const res = await fetch('/api/neighborhood-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: form.city,
          activities: form.activities,
          foods: form.foods,
          budget: form.budget,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch suggestions')
      setNeighborhoodSuggestions(data.suggestions || [])
    } catch (err) {
      setSuggestionError('Could not load suggestions. Try again.')
      console.error(err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function toggleItem(field: keyof FormState, item: string) {
    setForm(prev => {
      const current = prev[field] as string[]
      return {
        ...prev,
        [field]: current.includes(item)
          ? current.filter(i => i !== item)
          : [...current, item]
      }
    })
  }

  function selectSingle(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: form.full_name,
          neighborhood: form.neighborhood,
          city: form.city,
          max_distance: form.distance,
          preferred_activities: form.activities,
          preferred_foods: form.foods,
          available_times: form.times,
          budget: form.budget,
          max_duration: form.duration,
          onboarding_completed: true,
        })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      console.error('Error saving profile:', e?.message ?? e?.code ?? JSON.stringify(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-sm font-medium text-red-500 mb-2">Sign-in failed</p>
        <p className="text-sm text-stone-500 mb-6">{authError}</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: '#D85A30' }}
        >
          Back to login
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-stone-400">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-stone-50 border-b border-stone-200">
        <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-1">Your profile</p>
        <h1 className="text-2xl font-medium text-stone-900">Preferences</h1>
        <p className="text-sm text-stone-500 mt-1">
          The more you fill in, the better your daily challenges get.
        </p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-8">

        {/* Personal */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Personal</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.full_name}
                onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-400 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Location</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
              <input
                type="text"
                placeholder="e.g. New York"
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-stone-700">Neighborhood</label>
                <button
                  onClick={fetchNeighborhoodSuggestions}
                  disabled={loadingSuggestions || !form.city.trim()}
                  className="text-xs font-medium disabled:opacity-40 transition-opacity"
                  style={{ color: '#D85A30' }}
                >
                  {loadingSuggestions ? 'Finding...' : 'AI suggest ↗'}
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. Williamsburg, Brooklyn"
                value={form.neighborhood}
                onChange={e => setForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              />

              {suggestionError && (
                <p className="text-xs text-red-500 mt-2">{suggestionError}</p>
              )}
              {neighborhoodSuggestions.length > 0 && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs font-medium text-orange-700 mb-2">AI suggestions based on your preferences:</p>
                  <div className="space-y-2">
                    {neighborhoodSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setForm(prev => ({ ...prev, neighborhood: s.name }))
                          setNeighborhoodSuggestions([])
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-stone-800">{s.name}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{s.reason}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Max distance</label>
              <div className="space-y-2">
                {DISTANCES.map(d => (
                  <button
                    key={d}
                    onClick={() => selectSingle('distance', d)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.distance === d
                        ? 'border-orange-400 bg-orange-50 text-orange-800'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Activities */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Activities I love</h2>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map(a => (
              <button
                key={a}
                onClick={() => toggleItem('activities', a)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  form.activities.includes(a)
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {/* Food */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Food & drink</h2>
          <div className="flex flex-wrap gap-2">
            {FOODS.map(f => (
              <button
                key={f}
                onClick={() => toggleItem('foods', f)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  form.foods.includes(f)
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Availability */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Availability</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">When are you free?</label>
              <div className="grid grid-cols-2 gap-2">
                {TIMES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => toggleItem('times', t.label)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      form.times.includes(t.label)
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-stone-800">{t.label}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Challenge time limit</label>
              <select
                value={form.duration}
                onChange={e => selectSingle('duration', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              >
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Budget */}
        <section>
          <h2 className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Budget per challenge</h2>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map(b => (
              <button
                key={b}
                onClick={() => selectSingle('budget', b)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  form.budget === b
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </section>

        {/* Sign out */}
        <section>
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors"
          >
            Sign out
          </button>
        </section>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-white border-t border-stone-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
          style={{ background: '#D85A30' }}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}