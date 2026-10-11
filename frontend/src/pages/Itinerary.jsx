import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  MapPin,
  CalendarDays,
  X,
  ArrowUpRight,
  Bookmark,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import {
  Modal,
  EmptyState,
  ErrorMessage,
  Photo,
  dateLabel,
  SearchBar,
} from "../components/UI";
import PlanForm from "../components/PlanForm";
import { ProfilePrompt } from "../components/Profiles";

export function AddPoiModal({ itinerary, onClose }) {
  const { data, userId, act } = useApp();
  const [search, setSearch] = useState(""),
    [savedOnly, setSavedOnly] = useState(false);
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const records = data.catalog.filter(
    (p) =>
      !itinerary.pois.some((i) => i.poiId === p.poiId) &&
      (!savedOnly || data.saved.includes(p.poiId)) &&
      p.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  async function add(poi) {
    setPending(true);
    setError("");
    try {
      await act(
        () => api.itineraryPoi(userId, itinerary.itineraryNo, poi.poiId, true),
        "Added to your itinerary",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  const current =
    data.itineraries.find((i) => i.itineraryNo === itinerary.itineraryNo) ||
    itinerary;
  return (
    <Modal title="Add a discovery" onClose={onClose}>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Find a place for your itinerary…"
      />
      <label className="radio-label saved-only">
        <input
          type="checkbox"
          checked={savedOnly}
          onChange={(e) => setSavedOnly(e.target.checked)}
        />
        <Bookmark size={15} />
        Only my saved places
      </label>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="poi-picker">
        {records
          .filter((p) => !current.pois.some((i) => i.poiId === p.poiId))
          .map((p) => (
            <div className="picker-row" key={p.poiId}>
              <Photo poi={p} />
              <div>
                <strong>{p.name}</strong>
                <span>{p.cityName}</span>
              </div>
              <button
                className="button secondary small"
                aria-label={`Add ${p.name}`}
                disabled={pending}
                onClick={() => add(p)}
              >
                <Plus size={15} />
                Add
              </button>
            </div>
          ))}
        {!records.filter((p) => !current.pois.some((i) => i.poiId === p.poiId))
          .length && (
          <p className="muted">No more matching places. Try another search.</p>
        )}
      </div>
      <div className="modal-actions">
        <button className="button primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
export function AddToItinerary({ poi, onClose }) {
  const { data, userId, act } = useApp();
  const [tripNumber, setTripNumber] = useState("");
  const [number, setNumber] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await act(
        () => api.itineraryPoi(userId, Number(number), poi.poiId, true),
        "Added to your itinerary",
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  if (!userId) return <Modal title="Select a profile first" onClose={onClose}><ProfilePrompt/></Modal>;
  return (
    <Modal title="Add to an itinerary" onClose={onClose}>
      {data.itineraries.length ? (
        <form className="form-stack" onSubmit={submit}>
          <p className="muted">Make room for {poi.name}.</p>
          <label>Trip<select required value={tripNumber} onChange={e => { setTripNumber(e.target.value); setNumber(''); }}><option value="">Choose a trip</option>{data.trips.map(t => <option key={t.tripNo} value={t.tripNo}>{t.tripName}{t.status?.trim().toUpperCase() === 'COMPLETED' ? ' · Completed' : ''}</option>)}</select></label>
          <label>
            Itinerary
            <select
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            >
              <option value="">Choose an itinerary</option>
              {data.itineraries.filter(i => i.tripNo === Number(tripNumber)).map((i) => (
                <option
                  value={i.itineraryNo}
                  key={i.itineraryNo}
                  disabled={i.pois.some((p) => p.poiId === poi.poiId)}
                >
                  {i.itineraryName}
                  {i.pois.some((p) => p.poiId === poi.poiId)
                    ? " · already added"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          {tripNumber && !data.itineraries.some(i => i.tripNo === Number(tripNumber)) && <p className="muted">This trip has no itineraries. <Link to={`/trips/${tripNumber}`} onClick={onClose}>Open trip to create one</Link>.</p>}
          <ErrorMessage>{error}</ErrorMessage>
          <div className="modal-actions">
            <button className="button primary" disabled={pending}>
              {pending ? "Adding…" : "Add place"}
            </button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="Start with a little plan"
          text="Create a trip and an itinerary, then add this place to it."
        >
          <Link to="/trips" className="button primary" onClick={onClose}>
            Go to my trips
          </Link>
        </EmptyState>
      )}
    </Modal>
  );
}
export default function Itinerary() {
  const { id } = useParams(),
    { data, userId, act } = useApp();
  const itinerary = data.itineraries.find((i) => i.itineraryNo === Number(id));
  const [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(null);
  if (!userId) return <ProfilePrompt/>;
  if (!itinerary)
    return (
      <EmptyState
        title="Itinerary not found"
        text="This itinerary isn’t available for the current traveler."
      >
        <Link to="/trips" className="button secondary">
          Back to trips
        </Link>
      </EmptyState>
    );
  async function remove(poiId) {
    setPending(poiId);
    setError("");
    try {
      await act(
        () => api.itineraryPoi(userId, itinerary.itineraryNo, poiId, false),
        "Removed from the itinerary",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="container itinerary-page">
      <Link className="back-link" to={`/trips/${itinerary.tripNo}`}>
        <ArrowLeft size={16} />
        {data.trips.find((t) => t.tripNo === itinerary.tripNo)?.tripName ||
          "Back to trip"}
      </Link>
      <div className="page-heading heading-with-action">
        <div>
          <p className="eyebrow">YOUR ITINERARY</p>
          <h1>{itinerary.itineraryName}</h1>
          <p>
            {itinerary.description ||
              "Your discoveries, gathered in one place."}
          </p>
          <p className="trip-meta">
            <CalendarDays size={16} />
            {dateLabel(itinerary.startDate)}
            {itinerary.endDate &&
              itinerary.endDate !== itinerary.startDate &&
              ` – ${dateLabel(itinerary.endDate)}`}
          </p>
        </div>
        <div className="action-row">
          <button className="button secondary" onClick={() => setModal("edit")}>
            <Pencil size={16} />
            Edit itinerary
          </button>
          <button className="button primary" onClick={() => setModal("add")}>
            <Plus size={17} />
            Add places
          </button>
        </div>
      </div>
      <div className="itinerary-layout">
        <section className="itinerary-stops">
          <div className="section-heading">
            <h2>
              {itinerary.pois.length}{" "}
              {itinerary.pois.length === 1 ? "discovery" : "discoveries"} in
              your plan
            </h2>
          </div>
          <ErrorMessage>{error}</ErrorMessage>
          {itinerary.pois.length ? (
            itinerary.pois.map((p) => (
              <article className="itinerary-stop" key={p.poiId}>
                <Photo poi={p} credit />
                <div>
                  <p className="card-location">
                    <MapPin size={13} />
                    {p.cityName}
                  </p>
                  <Link className="card-title" to={`/pois/${p.poiId}`}>
                    {p.name}
                    <ArrowUpRight size={16} />
                  </Link>
                  <p className="muted">{p.description}</p>
                  <span className="stop-hours">{p.openingHours}</span>
                </div>
                <button
                  disabled={pending !== null}
                  className="icon-button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove(p.poiId)}
                >
                  <X size={19} />
                </button>
              </article>
            ))
          ) : (
            <EmptyState
              title="A blank page for new adventures"
              text="Add your saved places or explore the guide to fill this itinerary."
            >
              <button
                className="button primary"
                onClick={() => setModal("add")}
              >
                Add your first place
              </button>
            </EmptyState>
          )}
        </section>
        <aside className="itinerary-summary">
          <span className="eyebrow">A PLAN WITH POSSIBILITIES</span>
          <h2>Leave room for the unexpected.</h2>
          <p>
            Keep your favourite places together and let the day unfold at your
            own pace.
          </p>
          <div>
            <MapPin size={18} />
            <strong>{itinerary.pois.length}</strong> places to explore
          </div>
          <Link className="button secondary" to="/explore">
            Find more discoveries <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      {modal === "edit" && (
        <PlanForm
          kind="itineraries"
          item={itinerary}
          onClose={() => setModal("")}
        />
      )}
      {modal === "add" && (
        <AddPoiModal itinerary={itinerary} onClose={() => setModal("")} />
      )}
    </div>
  );
}
