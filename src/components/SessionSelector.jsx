import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SessionSelector({ sessions, selectedId, onSelect }) {
  const [availability, setAvailability] = useState({})

  useEffect(() => {
    if (sessions.length === 0) return
    checkAvailability()
  }, [sessions])

  async function checkAvailability() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('availability')
      .select('session_id, spots_left')
      .gte('date', today)
      .gt('spots_left', 0)

    const counts = {}
    if (data) {
      data.forEach(row => {
        counts[row.session_id] = (counts[row.session_id] || 0) + 1
      })
    }
    setAvailability(counts)
  }

  return (
    <div className="sessions-grid">
      {sessions.map(session => {
        const hasAvailability = (availability[session.id] || 0) > 0
        const isSelected = selectedId === session.id
        return (
          <div
            key={session.id}
            className={`session-card ${isSelected ? 'selected' : ''} ${!hasAvailability ? 'no-availability' : ''}`}
            onClick={() => hasAvailability && onSelect(session)}
            title={!hasAvailability ? 'No availability for this session' : ''}
          >
            <div className="session-dot" style={{ background: session.color }} />
            <div className="session-name">{session.name}</div>
            <div className="session-meta">
              <span>{session.duration}</span>
              <span>{session.capacity > 1 ? `Up to ${session.capacity} people` : 'Private'}</span>
            </div>
            {session.description && <div className="session-desc">{session.description}</div>}
            {!hasAvailability && (
              <div className="session-no-avail">No upcoming availability</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
