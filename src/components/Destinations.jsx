import { popularDestinations } from '../data/destinations'
import './Destinations.css'

function Destinations({ onSelect }) {
  return (
    <section className="section destinations" id="destinations">
      <div className="section-inner">
        <p className="eyebrow">Popular destinations</p>
        <h2>Places that make planning feel inspiring.</h2>
        <p className="section-lead">
          These are sample ideas with stock photography. Choose one to fill the
          destination field and keep planning from there.
        </p>

        <div className="destination-grid">
          {popularDestinations.map((place) => (
            <article className="destination-card" key={place.id}>
              <img src={place.image} alt={place.name} />
              <div className="destination-body">
                <span className="destination-tag">{place.tag}</span>
                <h3>{place.name}</h3>
                <p>{place.description}</p>
                <button
                  className="card-link"
                  type="button"
                  onClick={() => onSelect(place.name)}
                >
                  Use this destination
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Destinations
