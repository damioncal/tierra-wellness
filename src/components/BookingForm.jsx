import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function BookingForm({ session, selectedDay, selectedTime, onSuccess, onBack }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { year, month, day } = selectedDay
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Insert booking
    const { error: bookingError } = await supabase.from('bookings').insert({
      availability_id: selectedTime.id,
      session_id: session.id,
      date: dateStr,
      time: selectedTime.time,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone || null,
      notes: form.notes || null,
      party_size: session.type === 'couples' ? 2 : 1,
    })

    if (bookingError) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    // Decrement spots_left
    await supabase
      .from('availability')
      .update({ spots_left: selectedTime.spots_left - 1 })
      .eq('id', selectedTime.id)

    setLoading(false)
    onSuccess({ ...form, session, date: dateStr, time: selectedTime.time })
  }

  const dateLabel = selectedDay
    ? `${MONTHS[selectedDay.month]} ${selectedDay.day}, ${selectedDay.year}`
    : ''

  return (
    <div className="booking-form-wrap">
      <div className="booking-summary-mini">
        <div className="bsm-dot" style={{ background: session.color }} />
        <div>
          <div className="bsm-name">{session.name}</div>
          <div className="bsm-detail">{dateLabel} at {selectedTime.time} · {session.duration}</div>
        </div>
        <button className="change-btn" onClick={onBack}>Change</button>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-row">
          <div className="form-group">
            <label>First name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Jane" />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Smith" />
          </div>
        </div>
        <div className="form-group">
          <label>Email address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jane@example.com" />
        </div>
        <div className="form-group">
          <label>Phone number <span className="optional">(optional)</span></label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+27 82 000 0000" />
        </div>
        {(session.type === 'individual' || session.type === 'retreat' || session.id.includes('plant')) && (
          <div className="form-group">
            <label>Anything we should know? <span className="optional">(optional)</span></label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Health conditions, intentions, questions..." />
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Confirming...' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}
