import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = 'tierra2024'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('bookings')

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) { setAuthed(true); setError('') }
    else setError('Incorrect password')
  }

  if (!authed) return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="app-logo" style={{ textAlign: 'center', marginBottom: '8px' }}>Tierra Wellness</div>
        <p className="admin-login-sub">Admin access</p>
        <form onSubmit={handleLogin} className="admin-login-form">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="submit-btn">Sign in</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="app-logo">Tierra Wellness</div>
        <div className="admin-header-right">
          <span className="admin-badge">Admin</span>
          <button className="admin-logout" onClick={() => setAuthed(false)}>Sign out</button>
        </div>
      </header>

      <div className="admin-tabs">
        {['bookings', 'availability', 'sessions'].map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <main className="admin-main">
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'availability' && <AvailabilityTab />}
        {tab === 'sessions' && <SessionsTab />}
      </main>
    </div>
  )
}

function BookingsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => { fetchBookings() }, [filter])

  async function fetchBookings() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let query = supabase.from('bookings').select('*').order('date').order('time')
    if (filter === 'upcoming') query = query.gte('date', today)
    if (filter === 'past') query = query.lt('date', today)
    const { data, error } = await query
    if (!error) setBookings(data)
    setLoading(false)
  }

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    fetchBookings()
  }

  const SESSION_NAMES = {
    'sound-1on1': '1 on 1 Sound Therapy',
    'sound-float': 'Floating Sound Bath',
    'sound-group': 'Group Sound Bath',
    'plant-individual': 'Individual Plant Medicine',
    'plant-couples': 'Couples Plant Medicine',
    'retreat-1day': '1 Day Individual Retreat',
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Bookings</h2>
        <div className="admin-filter">
          {['upcoming', 'past', 'all'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="admin-loading">Loading bookings...</div>}
      {!loading && bookings.length === 0 && <div className="admin-empty">{filter === 'upcoming' ? 'No upcoming bookings.' : filter === 'past' ? 'No past bookings.' : 'No bookings found.'}</div>}
      {!loading && bookings.length > 0 && (
        <div className="bookings-list">
          {bookings.map(b => (
            <div key={b.id} className={`booking-row ${b.status === 'cancelled' ? 'cancelled' : ''}`}>
              <div className="booking-row-main">
                <div className="booking-name">{b.first_name} {b.last_name}</div>
                <div className="booking-detail">{SESSION_NAMES[b.session_id] || b.session_id}</div>
                <div className="booking-detail">{formatDate(b.date)} at {b.time}</div>
                <div className="booking-detail">{b.email} {b.phone ? `· ${b.phone}` : ''}</div>
                {b.notes && <div className="booking-notes">Note: {b.notes}</div>}
              </div>
              <div className="booking-row-actions">
                {b.status === 'cancelled'
                  ? <span className="cancelled-badge">Cancelled</span>
                  : <button className="cancel-btn" onClick={() => cancelBooking(b.id)}>Cancel</button>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AvailabilityTab() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(false)
  const [newTime, setNewTime] = useState('09:00')
  const [selectedDay, setSelectedDay] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSessions() }, [])
  useEffect(() => { if (selectedSession) fetchAvailability() }, [selectedSession, year, month])

  async function fetchSessions() {
    const { data } = await supabase.from('sessions').select('id, name').order('name')
    if (data) { setSessions(data); setSelectedSession(data[0]?.id || '') }
  }

  async function fetchAvailability() {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
    const { data } = await supabase.from('availability').select('*').eq('session_id', selectedSession).gte('date', startDate).lte('date', endDate).order('time')
    const grouped = {}
    if (data) data.forEach(row => {
      const day = parseInt(row.date.split('-')[2])
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(row)
    })
    setAvailability(grouped)
    setLoading(false)
  }

  async function addSlot() {
    if (!selectedDay) return
    setSaving(true)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    const session = sessions.find(s => s.id === selectedSession)
    await supabase.from('availability').upsert({
      session_id: selectedSession,
      date: dateStr,
      time: newTime,
      spots_total: 1,
      spots_left: 1,
    }, { onConflict: 'session_id,date,time' })
    await fetchAvailability()
    setSaving(false)
  }

  async function removeSlot(id) {
    await supabase.from('availability').delete().eq('id', id)
    fetchAvailability()
  }

  async function blockDay() {
    if (!selectedDay) return
    setSaving(true)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    await supabase.from('availability').delete().eq('session_id', selectedSession).eq('date', dateStr)
    setAvailability(prev => { const next = { ...prev }; delete next[selectedDay]; return next })
    setSaving(false)
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelectedDay(null) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelectedDay(null) }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Availability</h2>
        <select className="admin-select" value={selectedSession} onChange={e => { setSelectedSession(e.target.value); setSelectedDay(null) }}>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="avail-layout">
        <div className="avail-calendar">
          <div className="cal-header">
            <button className="cal-nav" onClick={prevMonth}>&#8249;</button>
            <span className="cal-title">{MONTHS[month]} {year}</span>
            <button className="cal-nav" onClick={nextMonth}>&#8250;</button>
          </div>
          {loading && <div className="admin-loading">Loading...</div>}
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day" />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const date = new Date(year, month, d)
              const isPast = date < today
              const hasSlots = !!availability[d]?.length
              const isSelected = selectedDay === d
              let cls = 'cal-day in-month'
              if (isPast) cls += ' past'
              else if (hasSlots) cls += ' has-slots available'
              if (isSelected) cls += ' selected-day'
              return (
                <div key={d} className={cls} onClick={() => !isPast && setSelectedDay(d)}>
                  <span className="day-num">{d}</span>
                  {hasSlots && !isPast && <div className="slot-dot" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="avail-sidebar">
          {!selectedDay && <div className="admin-empty">Select a date to manage slots</div>}
          {selectedDay && (
            <>
              <div className="avail-date-title">{selectedDay} {MONTHS[month]} {year}</div>
              <div className="avail-slots">
                {(availability[selectedDay] || []).length === 0 && <div className="admin-empty">No slots on this date</div>}
                {(availability[selectedDay] || []).map(slot => (
                  <div key={slot.id} className="avail-slot-row">
                    <span>{slot.time}</span>
                    <span className="slot-spots">{slot.spots_left}/{slot.spots_total} spots</span>
                    <button className="remove-slot-btn" onClick={() => removeSlot(slot.id)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="avail-add">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="time-input" />
                <button className="add-slot-btn" onClick={addSlot} disabled={saving}>Add slot</button>
              </div>
              <button className="block-day-btn" onClick={blockDay} disabled={saving}>Block entire day</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    setLoading(true)
    const { data } = await supabase.from('sessions').select('*').order('name')
    if (data) setSessions(data)
    setLoading(false)
  }

  async function saveSession() {
    setSaving(true)
    await supabase.from('sessions').update({
      name: editing.name,
      duration: editing.duration,
      description: editing.description,
      active: editing.active,
    }).eq('id', editing.id)
    await fetchSessions()
    setEditing(null)
    setSaving(false)
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Sessions</h2>
      </div>
      {loading && <div className="admin-loading">Loading sessions...</div>}
      <div className="sessions-admin-list">
        {sessions.map(s => (
          <div key={s.id} className="session-admin-row">
            {editing?.id === s.id ? (
              <div className="session-edit-form">
                <div className="form-group">
                  <label>Session name</label>
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input value={editing.duration} onChange={e => setEditing({ ...editing, duration: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={3} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} id={`active-${s.id}`} />
                  <label htmlFor={`active-${s.id}`} style={{ fontWeight: 400 }}>Active (visible to customers)</label>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button className="submit-btn" style={{ flex: 1 }} onClick={saveSession} disabled={saving}>Save</button>
                  <button className="change-btn" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="session-admin-info">
                  <div className="session-admin-name">{s.name}</div>
                  <div className="session-admin-meta">{s.duration} · {s.capacity > 1 ? `Up to ${s.capacity} people` : 'Private'}</div>
                  {s.description && <div className="session-admin-desc">{s.description}</div>}
                  {!s.active && <span className="inactive-badge">Hidden</span>}
                </div>
                <button className="change-btn" onClick={() => setEditing({ ...s })}>Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
