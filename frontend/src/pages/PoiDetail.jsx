import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Plus,
  Globe,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { typeLabels } from "../services/catalog";
import { useAsync } from "../hooks/useAsync";
import {
  Photo,
  Rating,
  money,
  dateLabel,
  Loading,
  EmptyState,
  ErrorMessage,
} from "../components/UI";
import { SaveButton } from "../components/POICard";
import Reviews from "../components/Reviews";
import { AddToItinerary } from "./Itinerary";

const fields = {
  places: [
    ["categories", "Categories"],
    ["establishedYear", "Established"],
    ["accessibilityInfo", "Accessibility"],
  ],
  restaurants: [
    ["cuisines", "Cuisines"],
    ["famousDishes", "Famous dishes"],
    ["priceRange", "Price range"],
    ["diningTypes", "Dining types"],
    ["ambience", "Ambience"],
    ["deliveryAvailable", "Delivery"],
    ["takeawayAvailable", "Takeaway"],
    ["reservationAvailable", "Reservations"],
    ["outdoorSeating", "Outdoor seating"],
    ["privateDining", "Private dining"],
    ["cateringAvailable", "Catering"],
    ["parkingAvailable", "Parking"],
    ["parkingTypes", "Parking types"],
    ["seatingCapacity", "Seating capacity"],
    ["accessibility", "Accessibility"],
    ["paymentMethods", "Payment methods"],
    ["reservationPolicy", "Reservation policy"],
    ["cancellationPolicy", "Cancellation policy"],
  ],
  activities: [
    ["activityType", "Activity type"],
    ["difficultyLevel", "Difficulty"],
    ["duration", "Duration"],
    ["minimumAge", "Minimum age"],
    ["maximumAge", "Maximum age"],
    ["seasons", "Seasons"],
    ["equipment", "Equipment"],
    ["safetyInformation", "Safety information"],
  ],
  events: [
    ["eventType", "Event type"],
    ["startDate", "Starts"],
    ["endDate", "Ends"],
    ["startTime", "Start time"],
    ["endTime", "End time"],
    ["organizer", "Organizer"],
    ["capacity", "Capacity"],
    ["registrationRequired", "Registration required"],
  ],
};
function valueLabel(value, key) {
  if (Array.isArray(value)) return value.join(" · ");
  if (key.endsWith("Date")) return dateLabel(value);
  if (value === "Y") return "Yes";
  if (value === "N") return "No";
  return String(value);
}
export default function PoiDetail() {
  const { id } = useParams(),
    { revision, data } = useApp();
  const result = useAsync(() => api.getPoi(id), [id, revision]);
  const [add, setAdd] = useState(false);
  if (result.loading) return <Loading />;
  if (result.error)
    return (
      <EmptyState title="We couldn’t find this discovery" text={result.error}>
        <Link to="/explore" className="button secondary">
          Back to explore
        </Link>
      </EmptyState>
    );
  const poi = {
    ...data.catalog.find((p) => p.poiId === Number(id)),
    ...result.data,
  };
  const price =
    poi.type === "restaurants"
      ? poi.priceRange || "Ask the venue"
      : money(
          poi.type === "activities"
            ? poi.cost
            : poi.type === "events"
              ? poi.ticketPrice
              : poi.entryFee,
        );
  let website;
  try {
    const url = new URL(poi.website);
    if (["https:", "http:"].includes(url.protocol)) website = url.href;
  } catch {
    /* Only display valid web URLs. */
  }
  return (
    <div className="container detail-page">
      <Link
        className="back-link"
        to={poi.type === "places" ? "/explore" : `/${poi.type}`}
      >
        <ArrowLeft size={16} />
        Back to {poi.type === "places" ? "explore" : poi.type}
      </Link>
      <div className="detail-heading">
        <div>
          <span className={`badge static ${poi.type}`}>
            {typeLabels[poi.type]}
          </span>
          <h1>{poi.name}</h1>
          <div className="detail-location">
            <MapPin size={16} />
            {poi.cityName || poi.addressCity}, {poi.addressState}
            <span className="divider-dot">·</span>
            <Rating value={poi.averageRating} count={poi.reviewCount} />
          </div>
        </div>
        <div className="action-row">
          <SaveButton poi={poi} />
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={17} />
            Add to itinerary
          </button>
        </div>
      </div>
      <Photo poi={poi} eager credit className="detail-photo" />
      <div className="detail-layout">
        <div>
          <section className="detail-section">
            <p className="eyebrow">A PLACE WITH A STORY</p>
            <h2>About this {typeLabels[poi.type]?.toLowerCase() || "place"}</h2>
            <p className="detail-description">
              {poi.description || "Contact the venue for more information."}
            </p>
          </section>
          <section className="detail-section">
            <h2>Good to know</h2>
            <dl className="metadata-grid">
              {(fields[poi.type] || [])
                .filter(
                  ([key]) =>
                    poi[key] !== null &&
                    poi[key] !== undefined &&
                    poi[key] !== "" &&
                    (!Array.isArray(poi[key]) || poi[key].length),
                )
                .map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{valueLabel(poi[key], key)}</dd>
                  </div>
                ))}
            </dl>
            {poi.locations?.length > 0 && (
              <div className="nearby-links">
                <h3>Activity locations</h3>
                {poi.locations.map((p) => (
                  <Link
                    className="text-link"
                    key={p.poiId}
                    to={`/pois/${p.poiId}`}
                  >
                    {p.name}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            )}
          </section>
          <Reviews poi={poi} />
        </div>
        <aside className="visit-panel">
          <p className="eyebrow">PLAN YOUR VISIT</p>
          <h2>{price}</h2>
          <span className="muted">
            {poi.type === "restaurants"
              ? "Dining price range"
              : poi.type === "activities"
                ? "Activity cost"
                : poi.type === "events"
                  ? "Ticket price"
                  : "Entry fee"}
          </span>
          <div className="visit-info">
            <MapPin size={19} />
            <div>
              <h3>Location</h3>
              <p>
                {poi.streetAddress}
                <br />
                {poi.addressCity || poi.cityName}
                {poi.zip ? ` ${poi.zip}` : ""}
              </p>
            </div>
          </div>
          <div className="visit-info">
            <Clock size={19} />
            <div>
              <h3>Opening hours</h3>
              <p>{poi.openingHours || "Hours not listed"}</p>
            </div>
          </div>
          {website && (
            <a
              className="text-link"
              href={website}
              target="_blank"
              rel="noreferrer"
            >
              <Globe size={16} />
              Visit website <ArrowUpRight size={14} />
            </a>
          )}
          {poi.contacts?.map((phone) => (
            <a
              className="text-link"
              key={phone}
              href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}
            >
              <Phone size={16} />
              {phone}
            </a>
          ))}
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={17} />
            Add to my itinerary
          </button>
          <p className="visit-footnote">
            Check current hours and fees with the venue before your visit.
          </p>
          {poi.nearby?.length > 0 && (
            <div className="nearby-links">
              <h3>Nearby discoveries</h3>
              {poi.nearby.map((p) => (
                <Link
                  className="text-link"
                  key={p.poiId}
                  to={`/pois/${p.poiId}`}
                >
                  {p.name}
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
      {add && <AddToItinerary poi={poi} onClose={() => setAdd(false)} />}
    </div>
  );
}
