import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  MapPin,
  ArrowUpRight,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { typeLabels } from "../services/catalog";
import { collectionPrice } from "../services/collections";
import { AddToItinerary } from "../pages/Itinerary";
import { Plus } from "lucide-react";
import { Photo, Rating, money, dateLabel, ErrorMessage } from "./UI";

export function SaveButton({ poi, compact = false }) {
  const { data, userId, act, requireProfile } = useApp();
  const saved = data.saved.includes(poi.poiId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    if (!requireProfile()) return;
    setPending(true);
    setError("");
    try {
      await act(
        () => api.savePoi(userId, poi.poiId, !saved),
        saved
          ? "Removed from your saved places"
          : "Saved for your next adventure",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <span className={compact ? "save-control compact" : "save-control"}>
      <button
        disabled={pending}
        className={`${compact ? "icon-button" : "button secondary"} ${saved ? "is-saved" : ""}`}
        aria-label={`${saved ? "Unsave" : "Save"} ${poi.name}`}
        aria-pressed={saved}
        onClick={toggle}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        {!compact && (saved ? "Saved" : "Save place")}
      </button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </span>
  );
}
export default function POICard({ poi }) {
  const [add, setAdd] = useState(false);
  const { requireProfile } = useApp();
  const metadata = collectionPrice(poi, money) || (
    poi.type === "restaurants"
      ? poi.priceRange || "Dining"
      : poi.type === "activities"
        ? `${money(poi.cost)} · ${poi.duration || "Flexible duration"}`
        : poi.type === "events"
          ? dateLabel(poi.startDate)
          : money(poi.entryFee));
  return (
    <article className="poi-card">
      <div className="card-image">
        <Link
          to={`/pois/${poi.poiId}`}
          aria-label={`View ${poi.name}`}
          tabIndex={-1}
        >
          <Photo poi={poi} credit="inline" />
        </Link>
        <span className={`badge ${poi.type}`}>
          {typeLabels[poi.type] || "POI"}
        </span>
        <span className="card-rating">
          <Rating value={poi.averageRating} />
        </span>
      </div>
      <div className="card-body">
        <p className="card-location">
          <MapPin size={12} />
          {poi.cityName || poi.addressCity}
        </p>
        <Link className="card-title" to={`/pois/${poi.poiId}`}>
          {poi.name}
          <ArrowUpRight size={17} />
        </Link>
        <p className="card-description">{poi.description}</p>
        <div className="card-bottom">
          <span>
            {poi.type === "events" ? (
              <CalendarDays size={14} />
            ) : (
              <Clock size={14} />
            )}
            {metadata}
          </span>
          <SaveButton poi={poi} compact />
        </div>
        {(poi.saveCount !== undefined || poi.popularityScore !== undefined || poi.eventStatus || poi.cuisines?.length) && <p className="collection-metadata">{poi.cuisines?.join(' · ')}{poi.saveCount !== undefined && ` ${poi.saveCount} saves`}{poi.popularityScore !== undefined && ` · Score ${poi.popularityScore}`}{poi.eventStatus && ` ${poi.eventStatus}`}</p>}
        <button className="button secondary small card-add" aria-label={`Add ${poi.name} to itinerary`} onClick={() => requireProfile() && setAdd(true)}><Plus size={15}/>Add to Itinerary</button>
      </div>
      {add && <AddToItinerary poi={poi} onClose={() => setAdd(false)}/>}
    </article>
  );
}
