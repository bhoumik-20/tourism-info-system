import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  ArrowRight,
  CalendarDays,
  MapPin,
  Pencil,
  Trash2,
  Route,
  ArrowLeft,
} from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import PlanForm from "../components/PlanForm";
import { ProfilePrompt } from "../components/Profiles";
import DeleteDialog from "../components/DeleteDialog";
import { EmptyState, dateLabel } from "../components/UI";

export function TripCard({ trip, onEdit, onDelete }) {
  const { data } = useApp();
  const count = data.itineraries.filter((i) => i.tripNo === trip.tripNo).length;
  return (
    <article className="trip-card">
      <div className="trip-card-top">
        <span className="trip-icon">
          <Route size={23} />
        </span>
        <span className="status-badge">{trip.status || "Planned"}</span>
      </div>
      <Link className="trip-title" to={`/trips/${trip.tripNo}`}>
        {trip.tripName}
      </Link>
      <p className="muted">
        {trip.description || "A new adventure, ready to take shape."}
      </p>
      <p className="trip-meta">
        <CalendarDays size={16} />
        {dateLabel(trip.startDate)}
        {trip.endDate && ` – ${dateLabel(trip.endDate)}`}
      </p>
      <p className="trip-meta">
        <MapPin size={16} />
        {count} {count === 1 ? "itinerary" : "itineraries"}
      </p>
      <div className="trip-card-bottom">
        <Link className="text-link" to={`/trips/${trip.tripNo}`}>
          View trip <ArrowRight size={15} />
        </Link>
        <div>
          <button
            className="icon-button"
            aria-label={`Edit ${trip.tripName}`}
            onClick={() => onEdit(trip)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`Delete ${trip.tripName}`}
            onClick={() => onDelete(trip)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Trips() {
  const { data, act, userId } = useApp();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null);
  if (!userId) return <ProfilePrompt/>;
  return (
    <div className="container plans-page">
      <div className="page-heading heading-with-action">
        <div>
          <p className="eyebrow">A LITTLE PLANNING, A LOT TO DISCOVER</p>
          <h1>Your next chapter.</h1>
          <p>
            Bring your favourite discoveries together and make the journey your
            own.
          </p>
        </div>
        <button className="button primary" onClick={() => setEdit({})}>
          <Plus size={18} />
          Create trip
        </button>
      </div>
      {data.trips.length ? (
        <div className="trip-grid">
          {data.trips.map((t) => (
            <TripCard
              key={t.tripNo}
              trip={t}
              onEdit={setEdit}
              onDelete={setRemove}
            />
          ))}
          <button className="new-trip-card" onClick={() => setEdit({})}>
            <Plus size={30} />
            <h2>Where to next?</h2>
            <p>Start a new trip.</p>
          </button>
        </div>
      ) : (
        <EmptyState
          title="Every great trip starts somewhere"
          text="Create a trip, add an itinerary, and fill it with places you’d love to visit."
        >
          <button className="button primary" onClick={() => setEdit({})}>
            <Plus size={17} />
            Create your first trip
          </button>
        </EmptyState>
      )}
      {edit && (
        <PlanForm
          item={edit.tripNo ? edit : null}
          onClose={() => setEdit(null)}
          onSaved={(t) => {
            if (!edit.tripNo) navigate(`/trips/${t.tripNo}`);
          }}
        />
      )}
      {remove && (
        <DeleteDialog
          title="Delete this trip?"
          text={`“${remove.tripName}” will be removed. Trips with itineraries must have those itineraries removed first.`}
          onClose={() => setRemove(null)}
          onDelete={() =>
            act(
              () => api.deletePlan("trips", userId, remove.tripNo),
              "Trip deleted",
            )
          }
        />
      )}
    </div>
  );
}
export function TripDetail() {
  const { tripNo } = useParams(),
    { data, userId, act } = useApp();
  const navigate = useNavigate();
  const trip = data.trips.find((t) => t.tripNo === Number(tripNo));
  const itineraries = data.itineraries.filter(
    (i) => i.tripNo === Number(tripNo),
  );
  const [form, setForm] = useState(null),
    [remove, setRemove] = useState(null);
  if (!userId) return <ProfilePrompt/>;
  if (!trip)
    return (
      <EmptyState
        title="Trip not found"
        text="This trip isn’t available for the current traveler."
      >
        <Link to="/trips" className="button secondary">
          Back to trips
        </Link>
      </EmptyState>
    );
  return (
    <div className="container plans-page">
      <Link className="back-link" to="/trips">
        <ArrowLeft size={16} />
        My trips
      </Link>
      <div className="page-heading heading-with-action">
        <div>
          <span className="status-badge">{trip.status || "Planned"}</span>
          <h1>{trip.tripName}</h1>
          <p>{trip.description || "Your next discovery is waiting."}</p>
          <p className="trip-meta">
            <CalendarDays size={16} />
            {dateLabel(trip.startDate)}
            {trip.endDate && ` – ${dateLabel(trip.endDate)}`}
          </p>
        </div>
        <div className="action-row">
          <button
            className="button secondary"
            onClick={() => setForm({ kind: "trips", item: trip })}
          >
            <Pencil size={16} />
            Edit trip
          </button>
          <button
            className="icon-button"
            aria-label="Delete trip"
            onClick={() => setRemove({ kind: "trips", item: trip })}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">MAKE ROOM FOR DISCOVERY</p>
          <h2>Your itineraries</h2>
        </div>
        <button
          className="button primary"
          onClick={() => setForm({ kind: "itineraries" })}
        >
          <Plus size={17} />
          Create itinerary
        </button>
      </div>
      {itineraries.length ? (
        <div className="trip-grid">
          {itineraries.map((i) => (
            <article className="trip-card" key={i.itineraryNo}>
              <span className="trip-icon">
                <Route size={23} />
              </span>
              <Link className="trip-title" to={`/itineraries/${i.itineraryNo}`}>
                {i.itineraryName}
              </Link>
              <p className="muted">
                {i.description || "Add a few places and let the day unfold."}
              </p>
              <p className="trip-meta">
                <CalendarDays size={15} />
                {dateLabel(i.startDate)}
              </p>
              <p className="trip-meta">
                <MapPin size={15} />
                {i.pois.length} saved stops
              </p>
              <div className="trip-card-bottom">
                <Link
                  className="text-link"
                  to={`/itineraries/${i.itineraryNo}`}
                >
                  Open itinerary <ArrowRight size={15} />
                </Link>
                <div>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${i.itineraryName}`}
                    onClick={() => setForm({ kind: "itineraries", item: i })}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${i.itineraryName}`}
                    onClick={() => setRemove({ kind: "itineraries", item: i })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Give your trip a little shape"
          text="Create an itinerary, then add places from your collection or the city guide."
        >
          <button
            className="button secondary"
            onClick={() => setForm({ kind: "itineraries" })}
          >
            Create itinerary
          </button>
        </EmptyState>
      )}
      {form && (
        <PlanForm
          kind={form.kind}
          item={form.item}
          tripNo={trip.tripNo}
          onClose={() => setForm(null)}
          onSaved={(i) => {
            if (form.kind === "itineraries" && !form.item)
              navigate(`/itineraries/${i.itineraryNo}`);
          }}
        />
      )}
      {remove && (
        <DeleteDialog
          title={`Delete this ${remove.kind === "trips" ? "trip" : "itinerary"}?`}
          text={
            remove.kind === "trips"
              ? "Remove all itineraries first, then delete the trip."
              : "This itinerary and its POI memberships will be removed."
          }
          onClose={() => setRemove(null)}
          onDelete={async () => {
            await act(
              () =>
                api.deletePlan(
                  remove.kind,
                  userId,
                  remove.item[
                    remove.kind === "trips" ? "tripNo" : "itineraryNo"
                  ],
                ),
              "Deleted",
            );
            if (remove.kind === "trips") navigate("/trips");
          }}
        />
      )}
    </div>
  );
}
