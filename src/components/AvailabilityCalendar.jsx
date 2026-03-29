import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function AvailabilityCalendar({ session, selectedDay, onSelectDay }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [availability, setAvailability] = useState({})
  const [excluded, setExcluded] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    fetchAvailability()
  }, [session, year, month])

  async function fetchAvailability() {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

    const [availRes, excludeRes] = await Promise.all([
      supabase
        .from('availability')
        .select('date, time, spots_left, spots_total')
        .eq('session_id', session.id)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('excluded_dates')
        .select('date')
        .gte('date', startDate)
        .lte('date', endDate)
    ])

    const excludedDays = (excludeRes.data || []).map(r => r.date)
    setExcluded(excludedDays)

    const grouped = {}
    if (availRes.data) {
      availRes.data.forEach(row => {
        if (excludedDays.includes(row.date)) return
        const day = parseInt(row.date.split('-')[2])
        if (!grouped[day]) grouped[day] = []
        grouped[day].push(row)
      })
    }
    setAvailability(grouped)
    setLoading(false)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    onSelectDay(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    onSelectDay(null)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <div className="calendar-panel">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>&#8249;</button>
        <span className="cal-title">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>&#8250;</button>
      </div>

      {loading && <div className="cal-loading">Loading availability...</div>}

      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="cal-day" />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const date = new Date(year, month, d)
          const isPast = date < today
          const isToday = date.getTime() === today.getTime()
          const isExcluded = excluded.includes(dateStr)
          const daySlots = availability[d] || []
          const availableSlots = daySlots.filter(s => s.spots_left > 0)
          const fullSlots = daySlots.filter(s => s.spots_left === 0)
          const hasAvailable = availableSlots.length > 0
          const allFull = daySlots.length > 0 && fullSlots.length === daySlots.length
          const lowSlots = hasAvailable && availableSlots.some(s => s.spots_left <= 2)
          const isSelected = selectedDay?.day === d && selectedDay?.month === month && selectedDay?.year === year

          let cls = 'cal-day in-month'
          let indicator = null

          if (isPast) {
            cls += ' past'
          } else if (isExcluded) {
            cls += ' excluded'
            indicator = <div className="slot-dot dot-excluded" />
          } else if (allFull) {
            cls += ' all-full'
            indicator = <div className="slot-dot dot-full" />
          } else if (hasAvailable) {
            cls += ' available'
            if (lowSlots) {
              cls += ' low-slots'
              indicator = <div className="slot-dot dot-low" />
            } else {
              cls += ' has-slots'
              indicator = <div className="slot-dot dot-available" />
            }
          } else {
            cls += ' no-slots'
          }

          if (isSelected) cls += ' selected-day'
          if (isToday) cls += ' today'

          return (
            <div
              key={d}
              className={cls}
              onClick={() => !isPast && !isExcluded && hasAvailable && onSelectDay({ day: d, month, year })}
            >
              <span className="day-num">{d}</span>
              {!isPast && indicator}
            </div>
          )
        })}
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot dot-available" /> Available</div>
        <div className="legend-item"><div className="legend-dot dot-low" /> Limited</div>
        <div className="legend-item"><div className="legend-dot dot-full" /> Full</div>
        <div className="legend-item"><div className="legend-dot dot-excluded" /> Unavailable</div>
      </div>
    </div>
  )
}
