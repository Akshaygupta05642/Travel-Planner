import { CalendarDays, MapPinned, Wallet } from 'lucide-react'
import './Features.css'

const items = [
  {
    icon: MapPinned,
    title: 'Personalized itineraries',
    text: 'Start with your destination, dates, and interests so the trip outline stays aligned with how you actually like to travel.',
  },
  {
    icon: Wallet,
    title: 'Budget planning',
    text: 'Capture a total budget and traveler count up front. The planner shows a simple per-person split so spend stays visible.',
  },
  {
    icon: CalendarDays,
    title: 'Trip organization',
    text: 'Keep departure city, travel window, and preferences in one place instead of scattered notes across apps and chats.',
  },
]

function Features() {
  return (
    <section className="section features" id="features">
      <div className="section-inner">
        <p className="eyebrow">Why Voyagea</p>
        <h2>A calmer way to organize a trip.</h2>
        <p className="section-lead">
          Phase 1 is a polished planning workspace. Later phases can save trips
          and connect real services. Nothing here pretends to be live booking data.
        </p>
        <div className="feature-grid">
          {items.map((item) => (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon">
                <item.icon size={22} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
