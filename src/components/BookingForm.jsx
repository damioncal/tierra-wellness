import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseMinutes(duration) {
  if (!duration) return 60
  if (duration.toLowerCase().includes('full day')) return 480
  const match = duration.match(/(\d+)/)
  return match ? parseInt(match[1]) : 60
}

function calcEndTime(startTime, durationStr) {
  const [h, m] = startTime.split(':').map(Number)
  const mins = parseMinutes(durationStr)
  const total = h * 60 + m + mins
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function googleCalendarUrl(session, date, startTime, endTime, name) {
  const dateFormatted = date.replace(/-/g, '')
  const startFormatted = `${dateFormatted}T${startTime.replace(':', '')}00`
  const endFormatted = `${dateFormatted}T${endTime.replace(':', '')}00`
  const title = encodeURIComponent(`${session.name} — Tierra Wellness`)
  const details = encodeURIComponent(`Your ${session.name} session with Tierra Wellness.\n\nBooked by: ${name}`)
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}`
}

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

    // Check capacity hasn't been taken since page loaded
    const { data: currentSlot } = await supabase
      .from('availability')
      .select('spots_left')
      .eq('id', selectedTime.id)
      .single()

    if (!currentSlot || currentSlot.spots_left <= 0) {
      setError('Sorry, this slot has just been taken. Please choose another time.')
      setLoading(false)
      return
    }

    const partySize = session.type === 'couples' ? 2 : 1
    if (currentSlot.spots_left < partySize) {
      setError('Not enough spots remaining for this session type.')
      setLoading(false)
      return
    }

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
      party_size: partySize,
    })

    if (bookingError) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    await supabase
      .from('availability')
      .update({ spots_left: currentSlot.spots_left - partySize })
      .eq('id', selectedTime.id)

    const endTime = calcEndTime(selectedTime.time, session.duration)
    const calUrl = googleCalendarUrl(session, dateStr, selectedTime.time, endTime, `${form.firstName} ${form.lastName}`)

    setLoading(false)
    onSuccess({
      ...form,
      session,
      date: dateStr,
      time: selectedTime.time,
      endTime,
      calendarUrl: calUrl,
    })
  }

  const dateLabel = selectedDay
    ? `${MONTHS[selectedDay.month]} ${selectedDay.day}, ${selectedDay.year}`
    : ''
  const endTime = calcEndTime(selectedTime.time, session.duration)

  return (
    <div className="booking-form-wrap">
      <div className="booking-summary-mini">
        <div className="bsm-dot" style={{ background: session.color }} />
        <div>
          <div className="bsm-name">{session.name}</div>
          <div className="bsm-detail">{dateLabel} · {selectedTime.time} – {endTime}</div>
          <div className="bsm-detail">{session.duration}{session.instructor ? ` · ${session.instructor}` : ''}</div>
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
