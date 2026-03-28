import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import SessionSelector from './components/SessionSelector'
import AvailabilityCalendar from './components/AvailabilityCalendar'
import TimeSlots from './components/TimeSlots'
import BookingForm from './components/BookingForm'
import Confirmation from './components/Confirmation'
import Admin from './components/Admin'
import './App.css'

export default function App() {
  const isAdmin = window.location.pathname === '/admin'
  if (isAdmin) return <Admin />

  const [sessions, setSessions] = useState([])
  const [step, setStep] = useState('select')
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    const { data, error } = await supabase.from('sessions').select('*').eq('active', true).order('name')
    if (!error) setSessions(data)
  }

  function handleSelectSession(session) { setSelectedSession(session); setSelectedDay(null); setSelectedTime(null); setStep('calendar') }
  function handleSelectDay(day) { setSelectedDay(day); setSelectedTime(null) }
  function handleSelectTime(slot) { setSelectedTime(slot) }
  function handleContinue() { if (selectedSession && selectedDay && selectedTime) setStep('form') }
  function handleConfirmed(booking) { setConfirmedBooking(booking); setStep('confirmed') }
  function handleReset() { setSelectedSession(null); setSelectedDay(null); setSelectedTime(null); setConfirmedBooking(null); setStep('select') }

  const canContinue = selectedSession && selectedDay && selectedTime

  return (
    <div className="app-wrap">
      <header className="app-header">
        <div className="app-logo">Tierra Wellness</div>
        <div className="app-tagline">Reserve your session</div>
      </header>
      <main className="app-main">
        {step === 'confirmed' ? (
          <Confirmation booking={confirmedBooking} onReset={handleReset} />
        ) : step === 'form' ? (
          <BookingForm session={selectedSession} selectedDay={selectedDay} selectedTime={selectedTime} onSuccess={handleConfirmed} onBack={() => setStep('calendar')} />
        ) : (
          <>
            <div className="section">
              <p className="step-label">Step 1 — Choose a session</p>
              <SessionSelector sessions={sessions} selectedId={selectedSession?.id} onSelect={handleSelectSession} />
            </div>
            {selectedSession && (
              <div className="section">
                <p className="step-label">Step 2 — Pick a date</p>
                <AvailabilityCalendar session={selectedSession} selectedDay={selectedDay} onSelectDay={handleSelectDay} />
              </div>
            )}
            {selectedDay && (
              <div className="section">
                <p className="step-label">Step 3 — Select a time</p>
                <TimeSlots session={selectedSession} selectedDay={selectedDay} selectedTime={selectedTime} onSelectTime={handleSelectTime} />
              </div>
            )}
            <div className="summary-bar">
              <div className="summary-info">
                {!selectedSession && <span className="summary-placeholder">Select a session to get started</span>}
                {selectedSession && !selectedDay && <><strong>{selectedSession.name}</strong><br /><span>Choose a date to continue</span></>}
                {selectedSession && selectedDay && !selectedTime && <><strong>{selectedSession.name}</strong><br /><span>Choose a time to continue</span></>}
                {canContinue && <><strong>{selectedSession.name}</strong><br /><span>{selectedDay.day}/{selectedDay.month + 1}/{selectedDay.year} at {selectedTime.time} · {selectedSession.duration}</span></>}
              </div>
              <button className="continue-btn" disabled={!canContinue} onClick={handleContinue}>Continue to booking</button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
