import { ArrowDownRight } from 'lucide-react'
import './Hero.css'

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <img
          src="/images/hero.jpg"
          alt="Coastal road winding toward the ocean at sunset"
        />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content">
        <p className="hero-kicker">Personalized travel itinerary planner</p>
        <h1>Design journeys that feel quietly exceptional.</h1>
        <p className="hero-subtitle">
          Share where you want to go, how you like to travel, and what you can spend.
          Voyagea helps you organize a trip outline you can actually use.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#plan">
            Plan my trip
            <ArrowDownRight size={18} />
          </a>
          <a className="btn btn-ghost" href="#destinations">
            Browse destinations
          </a>
        </div>
        <div className="hero-stats">
          <div>
            <strong>6 sample routes</strong>
            <p>Curated destination ideas to start from</p>
          </div>
          <div>
            <strong>5 travel styles</strong>
            <p>Adventure, nature, beaches, culture, food</p>
          </div>
          <div>
            <strong>Budget first</strong>
            <p>Keep dates, spend, and travelers together</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
