import { Compass } from 'lucide-react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <Compass size={20} />
            Voyagea
          </div>
          <p>
            Personalized Travel Itinerary Planner for thoughtful trips. Built as
            a frontend first, with sample destinations and local form planning.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li>
              <a href="#plan">Plan a trip</a>
            </li>
            <li>
              <a href="#destinations">Popular destinations</a>
            </li>
            <li>
              <a href="#features">Why Voyagea</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Note</h4>
          <p>
            Images are sample photography. Trip outlines stay in the browser and
            are not booked or stored on a server yet.
          </p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Voyagea. All rights reserved.</div>
    </footer>
  )
}

export default Footer
