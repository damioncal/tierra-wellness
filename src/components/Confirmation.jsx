export default function Confirmation({ booking, onReset }) {
  return (
    <div className="confirmation-wrap">
      <div className="confirm-icon">&#10003;</div>
      <h2 className="confirm-title">You're booked</h2>
      <p className="confirm-sub">A confirmation will be sent to <strong>{booking.email}</strong></p>

      <div className="confirm-card">
        <div className="confirm-row">
          <span className="confirm-label">Session</span>
          <span className="confirm-value">{booking.session.name}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Date</span>
          <span className="confirm-value">{booking.date}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Time</span>
          <span className="confirm-value">{booking.time}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Duration</span>
          <span className="confirm-value">{booking.session.duration}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Name</span>
          <span className="confirm-value">{booking.firstName} {booking.lastName}</span>
        </div>
      </div>

      <button className="reset-btn" onClick={onReset}>Book another session</button>
    </div>
  )
}
