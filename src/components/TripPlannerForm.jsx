jsx;
import { useEffect, useState } from "react";
import { CheckCircle2, Compass, Sparkles } from "lucide-react";
import { interestOptions } from "../data/destinations";
import "./TripPlannerForm.css";

const API_BASE_URL = "https://travel-planner-k801.onrender.com";

// Country and currency options.
const countries = [
  ["IN", "India", "INR"],
  ["US", "United States", "USD"],
  ["GB", "United Kingdom", "GBP"],
  ["JP", "Japan", "JPY"],
  ["CN", "China", "CNY"],
  ["CA", "Canada", "CAD"],
  ["AU", "Australia", "AUD"],
  ["NZ", "New Zealand", "NZD"],
  ["SG", "Singapore", "SGD"],
  ["AE", "United Arab Emirates", "AED"],
  ["SA", "Saudi Arabia", "SAR"],
  ["CH", "Switzerland", "CHF"],
  ["DE", "Germany", "EUR"],
  ["FR", "France", "EUR"],
  ["IT", "Italy", "EUR"],
  ["ES", "Spain", "EUR"],
  ["NL", "Netherlands", "EUR"],
  ["PT", "Portugal", "EUR"],
  ["IE", "Ireland", "EUR"],
  ["BE", "Belgium", "EUR"],
  ["AT", "Austria", "EUR"],
  ["GR", "Greece", "EUR"],
  ["FI", "Finland", "EUR"],
  ["MX", "Mexico", "MXN"],
  ["BR", "Brazil", "BRL"],
  ["ZA", "South Africa", "ZAR"],
  ["KR", "South Korea", "KRW"],
  ["TH", "Thailand", "THB"],
  ["MY", "Malaysia", "MYR"],
  ["ID", "Indonesia", "IDR"],
  ["PH", "Philippines", "PHP"],
  ["VN", "Vietnam", "VND"],
  ["TR", "Turkey", "TRY"],
  ["BD", "Bangladesh", "BDT"],
  ["PK", "Pakistan", "PKR"],
  ["LK", "Sri Lanka", "LKR"],
  ["NP", "Nepal", "NPR"],
  ["EG", "Egypt", "EGP"],
  ["NG", "Nigeria", "NGN"],
  ["KE", "Kenya", "KES"],
  ["RU", "Russia", "RUB"],
  ["SE", "Sweden", "SEK"],
  ["NO", "Norway", "NOK"],
  ["DK", "Denmark", "DKK"],
  ["PL", "Poland", "PLN"],
  ["CZ", "Czechia", "CZK"],
  ["HU", "Hungary", "HUF"],
  ["IL", "Israel", "ILS"],
  ["QA", "Qatar", "QAR"],
  ["KW", "Kuwait", "KWD"],
];

const initialValues = {
  destination: "",
  departureCity: "",
  departureDate: "",
  returnDate: "",
  budget: "",
  countryCode: "IN",
  travelers: "1",
  interests: [],
};

function getCurrency(countryCode) {
  return countries.find((country) => country[0] === countryCode)?.[2] || "USD";
}

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function validate(values) {
  const errors = {};

  if (!values.destination.trim()) {
    errors.destination = "Please enter a destination.";
  }

  if (!values.departureCity.trim()) {
    errors.departureCity = "Please enter a departure city.";
  }

  if (!values.departureDate) {
    errors.departureDate = "Choose a departure date.";
  }

  if (!values.returnDate) {
    errors.returnDate = "Choose a return date.";
  } else if (values.departureDate && values.returnDate < values.departureDate) {
    errors.returnDate = "Return date must be on or after departure.";
  }

  if (
    !values.budget ||
    !Number.isFinite(Number(values.budget)) ||
    Number(values.budget) <= 0
  ) {
    errors.budget = "Budget must be greater than 0.";
  }

  if (
    !Number.isInteger(Number(values.travelers)) ||
    Number(values.travelers) < 1
  ) {
    errors.travelers = "There must be at least 1 traveler.";
  }

  if (!values.interests.length) {
    errors.interests = "Select at least one travel interest.";
  }

  return errors;
}

async function convertToUSD(amount, currency) {
  if (currency === "USD") return Number(amount);

  const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`);

  if (!response.ok) {
    throw new Error(
      "Could not retrieve exchange rates. Check your internet connection.",
    );
  }

  const data = await response.json();

  if (data.result !== "success" || !Number.isFinite(data.rates?.USD)) {
    throw new Error("Currency conversion is currently unavailable.");
  }

  return Number(amount) * data.rates.USD;
}

async function convertFromUSD(amount, currency) {
  if (currency === "USD") return Number(amount) || 0;

  const response = await fetch("https://open.er-api.com/v6/latest/USD");

  if (!response.ok) {
    throw new Error("Could not retrieve exchange rates for the itinerary.");
  }

  const data = await response.json();

  if (data.result !== "success" || !Number.isFinite(data.rates?.[currency])) {
    throw new Error(
      "Could not convert itinerary costs to the selected currency.",
    );
  }

  return (Number(amount) || 0) * data.rates[currency];
}

function TripPlanner({ presetDestination = "" }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const currency = getCurrency(values.countryCode);

  useEffect(() => {
    if (presetDestination) {
      setValues((current) => ({
        ...current,
        destination: presetDestination,
      }));
    }
  }, [presetDestination]);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleInterest(id) {
    setValues((current) => ({
      ...current,
      interests: current.interests.includes(id)
        ? current.interests.filter((item) => item !== id)
        : [...current.interests, id],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);
    setApiError("");
    setItinerary(null);

    if (Object.keys(validationErrors).length) return;

    setLoading(true);

    try {
      const budgetUSD = await convertToUSD(values.budget, currency);

      const selectedInterests = values.interests.map(
        (id) => interestOptions.find((item) => item.id === id)?.label || id,
      );

      // Send the request to the deployed Render backend.
      const response = await fetch(`${API_BASE_URL}/ai/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: values.destination.trim(),
          departure_city: values.departureCity.trim(),
          departure_date: values.departureDate,
          return_date: values.returnDate,
          budget: budgetUSD,
          travelers: Number(values.travelers),
          interests: selectedInterests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to generate itinerary. Please try again.",
        );
      }

      if (!data.itinerary || !Array.isArray(data.itinerary.days)) {
        throw new Error("AI returned an unexpected itinerary format.");
      }

      const result = data.itinerary;

      const budgetBreakdown = await Promise.all(
        (result.budget_breakdown || []).map(async (item) => ({
          ...item,
          estimated_cost: await convertFromUSD(item.estimated_cost, currency),
        })),
      );

      const estimatedTotal = await convertFromUSD(
        result.estimated_total,
        currency,
      );

      const estimatedPerPerson = await convertFromUSD(
        result.estimated_per_person,
        currency,
      );

      setItinerary({
        ...result,
        currency,
        budgetEntered: Number(values.budget),
        travelers: Number(values.travelers),
        departureDate: values.departureDate,
        returnDate: values.returnDate,
        interests: selectedInterests,
        budget_breakdown: budgetBreakdown,
        estimated_total: estimatedTotal,
        estimated_per_person: estimatedPerPerson,
      });
    } catch (error) {
      setApiError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the deployed backend or exchange-rate service. Please check your internet connection and try again."
          : error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setValues(initialValues);
    setErrors({});
    setItinerary(null);
    setApiError("");
  }

  return (
    <section className="section planner" id="plan">
      <div className="section-inner">
        <p className="eyebrow">Trip planner</p>
        <h2>Tell us the shape of your trip.</h2>
        <p className="section-lead">
          Plan your next trip with an AI-generated itinerary tailored to your
          dates, budget, and interests.
        </p>

        <div className="form-card">
          {itinerary && (
            <div className="success-banner" role="status">
              <CheckCircle2 size={22} />
              <div>
                <h3>AI itinerary generated successfully!</h3>
                <p>
                  Your trip to {itinerary.destination} from{" "}
                  {itinerary.departureDate} to {itinerary.returnDate} is ready.
                  Estimated costs are not live prices.
                </p>
              </div>
            </div>
          )}

          {apiError && (
            <div
              className="error-text"
              role="alert"
              style={{ marginBottom: 16 }}
            >
              <strong>Itinerary generation failed:</strong> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className={`field ${errors.destination ? "has-error" : ""}`}>
                <label htmlFor="destination">Destination *</label>
                <input
                  id="destination"
                  name="destination"
                  value={values.destination}
                  onChange={handleChange}
                  placeholder="Kyoto, Japan"
                />
                {errors.destination && (
                  <p className="error-text">{errors.destination}</p>
                )}
              </div>

              <div
                className={`field ${errors.departureCity ? "has-error" : ""}`}
              >
                <label htmlFor="departureCity">Departure city *</label>
                <input
                  id="departureCity"
                  name="departureCity"
                  value={values.departureCity}
                  onChange={handleChange}
                  placeholder="Bhopal, India"
                />
                {errors.departureCity && (
                  <p className="error-text">{errors.departureCity}</p>
                )}
              </div>

              <div
                className={`field ${errors.departureDate ? "has-error" : ""}`}
              >
                <label htmlFor="departureDate">Departure date *</label>
                <input
                  id="departureDate"
                  name="departureDate"
                  type="date"
                  value={values.departureDate}
                  onChange={handleChange}
                />
                {errors.departureDate && (
                  <p className="error-text">{errors.departureDate}</p>
                )}
              </div>

              <div className={`field ${errors.returnDate ? "has-error" : ""}`}>
                <label htmlFor="returnDate">Return date *</label>
                <input
                  id="returnDate"
                  name="returnDate"
                  type="date"
                  value={values.returnDate}
                  onChange={handleChange}
                />
                {errors.returnDate && (
                  <p className="error-text">{errors.returnDate}</p>
                )}
              </div>

              <div className={`field ${errors.budget ? "has-error" : ""}`}>
                <label htmlFor="countryCode">Country / Currency *</label>
                <select
                  id="countryCode"
                  name="countryCode"
                  value={values.countryCode}
                  onChange={handleChange}
                >
                  {countries
                    .slice()
                    .sort((a, b) => a[1].localeCompare(b[1]))
                    .map(([code, name, currencyCode]) => (
                      <option key={code} value={code}>
                        {name} — {currencyCode}
                      </option>
                    ))}
                </select>

                <label htmlFor="budget">Total budget ({currency}) *</label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="1"
                  step="any"
                  value={values.budget}
                  onChange={handleChange}
                  placeholder="50000"
                />
                {errors.budget && <p className="error-text">{errors.budget}</p>}
              </div>

              <div className={`field ${errors.travelers ? "has-error" : ""}`}>
                <label htmlFor="travelers">Number of travelers *</label>
                <input
                  id="travelers"
                  name="travelers"
                  type="number"
                  min="1"
                  step="1"
                  value={values.travelers}
                  onChange={handleChange}
                />
                {errors.travelers && (
                  <p className="error-text">{errors.travelers}</p>
                )}
              </div>

              <div
                className={`field field-full ${
                  errors.interests ? "has-error" : ""
                }`}
              >
                <label>Travel interests *</label>
                <div className="interests">
                  {interestOptions.map((interest) => (
                    <label className="interest-chip" key={interest.id}>
                      <input
                        type="checkbox"
                        checked={values.interests.includes(interest.id)}
                        onChange={() => toggleInterest(interest.id)}
                      />
                      {interest.label}
                    </label>
                  ))}
                </div>
                {errors.interests && (
                  <p className="error-text">{errors.interests}</p>
                )}
              </div>
            </div>

            {itinerary && (
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Budget</span>
                  <strong>
                    {formatCurrency(
                      itinerary.budgetEntered,
                      itinerary.currency,
                    )}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Per traveler</span>
                  <strong>
                    {formatCurrency(
                      itinerary.budgetEntered / itinerary.travelers,
                      itinerary.currency,
                    )}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Travelers</span>
                  <strong>{itinerary.travelers}</strong>
                </div>

                <div className="summary-item">
                  <span>Interests</span>
                  <strong>{itinerary.interests.join(", ")}</strong>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-navy" type="submit" disabled={loading}>
                <Compass size={18} />
                {loading
                  ? "Generating AI itinerary..."
                  : "Generate AI itinerary"}
              </button>

              <button
                className="btn btn-text"
                type="button"
                onClick={handleReset}
                disabled={loading}
              >
                Clear form
              </button>

              <p className="form-note">
                {loading
                  ? "AI is creating your personalized trip. Please wait..."
                  : "Required fields are marked with *"}
              </p>
            </div>
          </form>

          {itinerary && (
            <section className="ai-results" aria-live="polite">
              <h2>
                <Sparkles size={22} /> Your AI travel itinerary
              </h2>
              <h3>{itinerary.destination}</h3>
              <p>{itinerary.summary}</p>

              <div className="ai-days">
                {itinerary.days.map((day) => (
                  <article
                    className="summary-item"
                    key={`${day.day}-${day.date}`}
                  >
                    <h3>
                      Day {day.day}: {day.title}
                    </h3>
                    <p>{day.date}</p>
                    <p>
                      <strong>Morning:</strong> {day.morning}
                    </p>
                    <p>
                      <strong>Afternoon:</strong> {day.afternoon}
                    </p>
                    <p>
                      <strong>Evening:</strong> {day.evening}
                    </p>
                  </article>
                ))}
              </div>

              <h3>Estimated budget breakdown ({itinerary.currency})</h3>
              <div className="summary-grid">
                {itinerary.budget_breakdown.map((item, index) => (
                  <div
                    className="summary-item"
                    key={`${item.category}-${index}`}
                  >
                    <span>{item.category}</span>
                    <strong>
                      {formatCurrency(item.estimated_cost, itinerary.currency)}
                    </strong>
                    <p>{item.notes}</p>
                  </div>
                ))}
              </div>

              <div className="summary-item">
                <p>Estimated total</p>
                <h3>
                  {formatCurrency(
                    itinerary.estimated_total,
                    itinerary.currency,
                  )}
                </h3>
                <p>
                  Per traveler:{" "}
                  {formatCurrency(
                    itinerary.estimated_per_person,
                    itinerary.currency,
                  )}
                </p>
              </div>

              <p className="form-note">
                {itinerary.disclaimer ||
                  "Costs are estimates, not live prices or bookings. Currency conversions are approximate."}
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

export default TripPlanner;
