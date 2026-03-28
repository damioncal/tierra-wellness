export default function SessionSelector({ sessions, selectedId, onSelect }) {
  return (
    <div className="sessions-grid">
      {sessions.map(session => (
        <div
          key={session.id}
          className={`session-card ${selectedId === session.id ? 'selected' : ''}`}
          onClick={() => onSelect(session)}
        >
          <div className="session-dot" style={{ background: session.color }} />
          <div className="session-name">{session.name}</div>
          <div className="session-meta">
            <span>{session.duration}</span>
            <span>{session.capacity > 1 ? `Up to ${session.capacity} people` : 'Private'}</span>
          </div>
          {session.description && (
            <div className="session-desc">{session.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
