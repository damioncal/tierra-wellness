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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    fetchAvailability()
  }, [session, year, month])

  async function fetchAvailability() {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

    const { data, error } = await supabase
      .from('availability')
      .select('date, time, spots_left, spots_total')
      .eq('session_id', session.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .gt('spots_left', 0)

    if (error) { console.error(error); setLoading(false); return }

    // Group by day number
    const grouped = {}
    data.forEach(row => {
      const day = parseInt(row.date.split('-')[2])
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(row)
    })
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
          const date = new Date(year, month, d)
          const isPast = date < today
          const isToday = date.getTime() === today.getTime()
          const daySlots = availability[d] || []
          const hasSlots = daySlots.length > 0
          const lowSlots = hasSlots && daySlots.some(s => s.spots_left <= 2)
          const isSelected = selectedDay?.day === d && selectedDay?.month === month && selectedDay?.year === year

          let cls = 'cal-day in-month'
          if (isPast) cls += ' past'
          else if (hasSlots) cls += lowSlots ? ' available low-slots' : ' available has-slots'
          if (isSelected) cls += ' selected-day'
          if (isToday) cls += ' today'

          return (
            <div
              key={d}
              className={cls}
              onClick={() => !isPast && hasSlots && onSelectDay({ day: d, month, year })}
            >
              <span className="day-num">{d}</span>
              {hasSlots && !isPast && <div className="slot-dot" />}
            </div>
          )
        })}
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot available-dot" /> Available</div>
        <div className="legend-item"><div className="legend-dot low-dot" /> Limited spots</div>
        <div className="legend-item"><div className="legend-dot none-dot" /> Unavailable</div>
      </div>
    </div>
  )
}
