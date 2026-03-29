import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseMinutes(duration) {
  if (!duration) return 60
  if (duration.includes('Full day') || duration.includes('full day')) return 480
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
            const endTime = calcEndTime(slot.time, session?.duration)
            const spotsPercent = slot.spots_total > 1 ? Math.round((slot.spots_left / slot.spots_total) * 100) : null

            return (
              <div
                key={slot.id}
                className={`time-slot ${isFull ? 'full' : ''} ${isSelected ? 'selected-slot' : ''} ${isLow && !isFull ? 'low' : ''}`}
                onClick={() => !isFull && onSelectTime(slot)}
              >
                <div className="slot-time-range">
                  <span className="slot-start">{slot.time}</span>
                  <span className="slot-arrow">→</span>
                  <span className="slot-end">{endTime}</span>
                </div>
                <div className="slot-status">
                  {isFull && <span className="slot-badge badge-full">Full</span>}
                  {!isFull && slot.spots_total > 1 && (
                    <span className={`slot-badge ${isLow ? 'badge-low' : 'badge-available'}`}>
                      {slot.spots_left} {slot.spots_left === 1 ? 'spot' : 'spots'} left
                    </span>
                  )}
                  {!isFull && slot.spots_total === 1 && (
                    <span className="slot-badge badge-available">Available</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
