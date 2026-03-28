import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TimeSlots({ session, selectedDay, selectedTime, onSelectTime }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session || !selectedDay) return
    fetchSlots()
  }, [session, selectedDay])

  async function fetchSlots() {
    setLoading(true)
    const { year, month, day } = selectedDay
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('availability')
      .select('id, time, spots_left, spots_total')
      .eq('session_id', session.id)
      .eq('date', dateStr)
      .order('time')

    if (error) { console.error(error); setLoading(false); return }
    setSlots(data)
    setLoading(false)
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  if (!selectedDay) return null

  const { year, month, day } = selectedDay
  const dateLabel = `${MONTHS[month]} ${day}, ${year}`

  return (
    <div className="slots-panel">
      <div className="slots-title">{dateLabel} — {session?.name}</div>
      {loading && <div className="slots-loading">Loading times...</div>}
      {!loading && (
        <div className="slots-grid">
          {slots.length === 0 && (
            <div className="slots-empty">No times available on this date.</div>
          )}
          {slots.map(slot => {
            const isFull = slot.spots_left === 0
            const isLow = slot.spots_left <= 2 && slot.spots_left > 0
            const isSelected = selectedTime?.id === slot.id
            return (
              <div
                key={slot.id}
                className={`time-slot ${isFull ? 'full' : ''} ${isSelected ? 'selected-slot' : ''}`}
                onClick={() => !isFull && onSelectTime(slot)}
              >
                {slot.time}
                {isLow && !isFull && (
                  <span className="spots-warning"> · {slot.spots_left} left</span>
                )}
                {isFull && <span className="spots-full"> · Full</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
