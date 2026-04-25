'use client'

import { useState } from 'react'
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
  neighborhood: string
  city: string
  distance: string
  activities: string[]
  foods: string[]
  times: string[]
  budget: string
  duration: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [form, setForm] = useState<FormState>({
    neighborhood: '',
    city: '',
    distance: 'Within 1 mile',
    activities: [],
    foods: [],
    times: [],
    budget: 'Under $25',
    duration: '2 hours',
  })

  const totalSteps = 4

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

  async function handleSubmit() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id:                   user.id,
          neighborhood:         form.neighborhood,
          city:                 form.city,
          max_distance:         form.distance,
          preferred_activities: form.activities,
          preferred_foods:      form.foods,
          available_times:      form.times,
          budget:               form.budget,
          max_duration:         form.duration,
          onboarding_completed: true,
        })

      if (error) throw error
      router.push('/')
    } catch (err) {
      console.error('Error saving preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-stone-50 border-b border-stone-200">
        <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-1">
          Step {step} of {totalSteps}
        </p>
        <h1 className="text-2xl font-medium text-stone-900">
          {step === 1 && 'Where are you based?'}
          {step === 2 && 'What do you love doing?'}
          {step === 3 && 'Food & drink?'}
          {step === 4 && 'Your availability'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {step === 1 && 'We use this to find nearby spots and routes.'}
          {step === 2 && 'Pick everything that sounds like you.'}
          {step === 3 && "We'll tailor food and drink suggestions to your taste."}
          {step === 4 && "When are you free and what's your budget?"}
        </p>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%`, background: '#D85A30' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {/* Step 1 — Location */}
        {step === 1 && (
          <div className="space-y-5">
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
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Neighborhood</label>
              <input
                type="text"
                placeholder="e.g. Williamsburg, Brooklyn"
                value={form.neighborhood}
                onChange={e => setForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Max distance from home</label>
              <div className="space-y-2">
                {DISTANCES.map(d => (
                  <button
                    key={d}
                    onClick={() => selectSingle('distance', d)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
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
        )}

        {/* Step 2 — Activities */}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Select all that apply</label>
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
          </div>
        )}

        {/* Step 3 — Food */}
        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Select all that apply</label>
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
          </div>
        )}

        {/* Step 4 — Availability */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">When are you usually free?</label>
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
              <label className="block text-sm font-medium text-stone-700 mb-2">Challenge time limit</label>
              <select
                value={form.duration}
                onChange={e => selectSingle('duration', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-stone-900"
              >
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">Budget per challenge</label>
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
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-5 py-5 border-t border-stone-200 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-stone-300 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !form.neighborhood.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#D85A30' }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || form.times.length === 0}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#D85A30' }}
          >
            {loading ? 'Saving...' : 'Start my adventure'}
          </button>
        )}
      </div>
    </div>
  )
}