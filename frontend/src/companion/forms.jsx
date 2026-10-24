import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Plus, Star } from "lucide-react";
import { TYPE_LABELS } from "./demoData.js";
import { Button, Field, FormActions, Modal } from "./components.jsx";

const today = () => new Date().toISOString().slice(0, 10);
const listValue = (value) => Array.isArray(value) ? value.join(", ") : value || "";
const parseList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
const asBoolean = (value) => value === true || value === "true";

export function TripForm({ trip, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    tripName: trip?.tripName || "",
    startDate: trip?.startDate || "",
    endDate: trip?.endDate || "",
    description: trip?.description || "",
    status: trip?.status || "Planned",
  }));
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.tripName.trim()) return setError("Enter a name for this trip.");
    if (form.startDate && form.endDate && form.endDate < form.startDate) return setError("The end date must be on or after the start date.");
    onSave({ ...form, tripName: form.tripName.trim(), description: form.description.trim() });
  };
  return <Modal title={trip ? "Edit trip" : "Create a trip"} eyebrow="USER → TRIP" onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <p className="form-note">A trip belongs to your traveler profile. Destination is not stored on the Trip record; choose places for its itineraries instead.</p>
      <Field label="Trip name" required><input autoFocus value={form.tripName} onChange={(e) => update("tripName", e.target.value)} placeholder="e.g. A long weekend in Mumbai" maxLength={80} /></Field>
      <div className="form-grid two"><Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field><Field label="End date"><input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></Field></div>
      <Field label="Status"><select value={form.status} onChange={(e) => update("status", e.target.value)}><option>Planned</option><option>In progress</option><option>Completed</option><option>Paused</option></select></Field>
      <Field label="Description"><textarea rows="3" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What would you like this trip to feel like?" maxLength={400} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel={trip ? "Save trip" : "Create trip"} />
    </form>
  </Modal>;
}

export function ItineraryForm({ itinerary, trips, defaultTripNo, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    tripNo: String(itinerary?.tripNo ?? defaultTripNo ?? trips[0]?.tripNo ?? ""),
    itineraryName: itinerary?.itineraryName || "",
    startDate: itinerary?.startDate || "",
    endDate: itinerary?.endDate || "",
    description: itinerary?.description || "",
  }));
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!trips.length) return setError("Create a trip first; every itinerary belongs to a trip.");
    if (!form.tripNo) return setError("Choose the parent trip for this itinerary.");
    if (!form.itineraryName.trim()) return setError("Enter a name for this itinerary.");
    if (form.startDate && form.endDate && form.endDate < form.startDate) return setError("The end date must be on or after the start date.");
    onSave({ ...form, tripNo: Number(form.tripNo), itineraryName: form.itineraryName.trim(), description: form.description.trim() });
  };
  return <Modal title={itinerary ? "Edit itinerary" : "Create an itinerary"} eyebrow="TRIP → ITINERARY → POI" onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <p className="form-note">An itinerary is owned by your profile and belongs to one trip. Add POIs after saving; the list order is only a frontend presentation aid.</p>
      <Field label="Parent trip" required><select value={form.tripNo} onChange={(e) => update("tripNo", e.target.value)} disabled={!trips.length}>{trips.map((trip) => <option key={trip.tripNo} value={trip.tripNo}>{trip.tripName}</option>)}</select></Field>
      <Field label="Itinerary name" required><input autoFocus value={form.itineraryName} onChange={(e) => update("itineraryName", e.target.value)} placeholder="e.g. Waterfront and old town" maxLength={80} /></Field>
      <div className="form-grid two"><Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field><Field label="End date"><input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></Field></div>
      <Field label="Description"><textarea rows="3" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="A few details about this plan" maxLength={400} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel={itinerary ? "Save itinerary" : "Create itinerary"} />
    </form>
  </Modal>;
}

export function ReviewForm({ poi, pois = [], review, onSave, onClose }) {
  const [poiId, setPoiId] = useState(String(poi?.poiId || ""));
  const [rating, setRating] = useState(String(review?.rating || "5"));
  const [comment, setComment] = useState(review?.comment || "");
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!pois.some((item) => item.poiId === Number(poiId))) return setError("Choose a valid point of interest.");
    if (!rating || Number(rating) < 1 || Number(rating) > 5) return setError("Choose a rating from 1 to 5.");
    if (!comment.trim()) return setError("Add a short comment before submitting.");
    onSave({ poiId: Number(poiId), rating: Number(rating), comment: comment.trim() });
  };
  return <Modal title={review ? "Edit your review" : "Write a review"} eyebrow={poi?.name || "TRAVELER REVIEW"} onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <p className="form-note">Your review is linked to your traveler profile and this POI. The displayed average rating is calculated from review records.</p>
      <Field label="Point of interest" required><select value={poiId} disabled={Boolean(review)} onChange={(e) => setPoiId(e.target.value)}><option value="">Choose a POI</option>{pois.map((item) => <option key={item.poiId} value={item.poiId}>{item.name} · {item.type}</option>)}</select></Field>
      <Field label="Rating" required><select value={rating} onChange={(e) => setRating(e.target.value)}><option value="">Choose a rating</option><option value="5">5 · Loved it</option><option value="4">4 · Very good</option><option value="3">3 · It was fine</option><option value="2">2 · Not for me</option><option value="1">1 · Disappointing</option></select></Field>
      <Field label="Comment" required><textarea autoFocus rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What should another traveler know?" maxLength={1000} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel={review ? "Update review" : "Submit review"} />
    </form>
  </Modal>;
}

export function AddToItineraryForm({ poi, itineraries, onSave, onClose }) {
  const [itineraryNo, setItineraryNo] = useState(String(itineraries[0]?.itineraryNo || ""));
  const [error, setError] = useState("");
  const selected = useMemo(() => itineraries.find((item) => item.itineraryNo === Number(itineraryNo)), [itineraries, itineraryNo]);
  const submit = (event) => {
    event.preventDefault();
    if (!selected) return setError("Create an itinerary first, then add this point of interest.");
    if (selected.poiIds.includes(poi.poiId)) return setError("This point of interest is already in that itinerary.");
    onSave(selected.itineraryNo);
  };
  return <Modal title="Add to itinerary" eyebrow={poi?.name} onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <p className="form-note">This creates an itinerary–POI membership in the local demo. A POI can appear in multiple itineraries.</p>
      {itineraries.length ? <Field label="Choose itinerary" required><select value={itineraryNo} onChange={(e) => setItineraryNo(e.target.value)}>{itineraries.map((item) => <option key={`${item.userId}:${item.itineraryNo}`} value={item.itineraryNo}>{item.itineraryName} · {item.tripName}</option>)}</select></Field> : <div className="inline-empty"><CalendarDays size={19} /><div><strong>No itineraries yet</strong><span>Create a trip and itinerary first.</span></div></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel="Add to itinerary" />
    </form>
  </Modal>;
}

export function CityForm({ city, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ cityName: city?.cityName || "", state: city?.state || "", country: city?.country || "India", description: city?.description || "", image: city?.image || "" }));
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); if (!form.cityName.trim() || !form.state.trim() || !form.country.trim()) return setError("City, state, and country are required."); onSave({ ...form, cityName: form.cityName.trim(), state: form.state.trim(), country: form.country.trim(), description: form.description.trim() }); };
  return <Modal title={city ? "Edit city" : "Add a city"} eyebrow="CURATOR · CITY MASTER DATA" onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <Field label="City name" required><input autoFocus value={form.cityName} onChange={(e) => update("cityName", e.target.value)} /></Field>
      <div className="form-grid two"><Field label="State / region" required><input value={form.state} onChange={(e) => update("state", e.target.value)} /></Field><Field label="Country" required><input value={form.country} onChange={(e) => update("country", e.target.value)} /></Field></div>
      <Field label="Description"><textarea rows="3" value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={300} /></Field>
      <Field label="Image path (optional)" hint="Use a path already present in frontend/public/images."><input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="/images/lalbagh.jpg" /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel={city ? "Save city" : "Add city"} />
    </form>
  </Modal>;
}

const subtypeDefaults = {
  place: { categories: "", entryFee: "0", establishedYear: "", accessibilityInfo: "" },
  restaurant: { cuisines: "", famousDishes: "", priceRange: "", diningTypes: "Dine-in", ambience: "", deliveryAvailable: "false", takeawayAvailable: "false", reservationAvailable: "false", outdoorSeating: "false", indoorSeating: "true", privateDining: "false", cateringAvailable: "false", parkingAvailable: "false", parkingType: "", seatingCapacity: "", accessibility: "", paymentMethods: "Cash, UPI", reservationPolicy: "", cancellationPolicy: "" },
  activity: { activityType: "", difficultyLevel: "Easy", duration: "", cost: "", minimumAge: "", maximumAge: "", seasons: "", equipmentRequired: "", safetyInformation: "" },
  event: { eventType: "", startDate: "", endDate: "", startTime: "", endTime: "", ticketPrice: "", organizer: "", capacity: "", registrationRequired: "false" },
};

function toCuratorForm(poi) {
  if (!poi) return { poiId: null, type: "place", name: "", cityId: "", description: "", street: "", area: "", contactNumbers: "", website: "", openingHours: "", image: "", hostRestaurantPoiId: "", activityLocationIds: "", nearbyIds: "", ...subtypeDefaults.place };
  const relationExtras = poi._relations || {};
  const address = poi.address || {};
  const base = { poiId: poi.poiId, type: poi.type, name: poi.name, cityId: String(poi.cityId), description: poi.description, street: address.street || "", area: address.area || "", contactNumbers: listValue(poi.contactNumbers), website: poi.website || "", openingHours: poi.openingHours || "", image: poi.image || "", hostRestaurantPoiId: relationExtras.hostRestaurantPoiId || "", activityLocationIds: listValue(relationExtras.activityLocationIds || []), nearbyIds: listValue(relationExtras.nearbyIds || []) };
  const defaults = subtypeDefaults[poi.type];
  const subtype = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = poi[key];
    subtype[key] = Array.isArray(defaultValue) || ["categories", "cuisines", "famousDishes", "diningTypes", "ambience", "parkingType", "accessibility", "seasons", "equipmentRequired"].includes(key)
      ? listValue(value)
      : typeof defaultValue === "boolean" ? String(Boolean(value)) : value === null || value === undefined ? "" : String(value);
  }
  return { ...base, ...subtype };
}

const arrayFields = new Set(["categories", "cuisines", "famousDishes", "diningTypes", "ambience", "parkingType", "accessibility", "seasons", "equipmentRequired"]);
const boolFields = new Set(["deliveryAvailable", "takeawayAvailable", "reservationAvailable", "outdoorSeating", "indoorSeating", "privateDining", "cateringAvailable", "parkingAvailable", "registrationRequired"]);
const numberFields = new Set(["entryFee", "establishedYear", "seatingCapacity", "cost", "minimumAge", "maximumAge", "ticketPrice", "capacity"]);

export function PoiForm({ poi, cities, allPois, relations, onSave, onClose }) {
  const initial = toCuratorForm(poi);
  const [form, setForm] = useState(() => ({ ...initial, cityId: initial.cityId || String(cities[0]?.cityId || "") }));
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => {
    if (key === "type" && value !== current.type) return { ...current, type: value, ...subtypeDefaults[value] };
    return { ...current, [key]: value };
  });
  const validRelated = allPois.filter((item) => item.poiId !== poi?.poiId);
  const hostOptions = allPois.filter((item) => item.type === "restaurant" && item.poiId !== poi?.poiId);
  const activityOptions = validRelated.filter((item) => item.type !== "event");
  const field = (key, label, { type = "text", placeholder = "", wide = false } = {}) => <Field key={key} label={label} className={wide ? "field-wide" : ""}>{type === "textarea" ? <textarea rows="2" value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} /> : <input type={type} value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} />}</Field>;
  const listField = (key, label) => field(key, label, { placeholder: "Separate items with commas" });
  const boolField = (key, label) => <Field key={key} label={label}><select value={form[key] ?? "false"} onChange={(e) => update(key, e.target.value)}><option value="true">Yes</option><option value="false">No</option></select></Field>;
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Enter a POI name.");
    if (!cities.some((city) => city.cityId === Number(form.cityId))) return setError("Choose a valid city for this POI.");
    if (!form.description.trim()) return setError("Enter a short description.");
    const data = { poiId: form.poiId, cityId: Number(form.cityId), type: form.type, name: form.name.trim(), description: form.description.trim(), address: { street: form.street.trim(), area: form.area.trim(), city: cities.find((city) => city.cityId === Number(form.cityId))?.cityName || "", state: cities.find((city) => city.cityId === Number(form.cityId))?.state || "", country: cities.find((city) => city.cityId === Number(form.cityId))?.country || "" }, contactNumbers: parseList(form.contactNumbers), website: form.website.trim(), openingHours: form.openingHours.trim(), image: form.image.trim() };
    for (const [key, rawValue] of Object.entries(subtypeDefaults[form.type])) {
      if (arrayFields.has(key)) data[key] = parseList(form[key] || "");
      else if (boolFields.has(key)) data[key] = asBoolean(form[key]);
      else if (numberFields.has(key)) data[key] = form[key] === "" ? null : Number(form[key]);
      else data[key] = String(form[key] ?? "").trim();
    }
    onSave({
      poi: data,
      hostRestaurantPoiId: form.hostRestaurantPoiId ? Number(form.hostRestaurantPoiId) : null,
      activityLocationIds: parseList(form.activityLocationIds).map(Number).filter((id) => validRelated.some((item) => item.poiId === id)),
      nearbyIds: parseList(form.nearbyIds).map(Number).filter((id) => validRelated.some((item) => item.poiId === id)),
    });
  };
  const relationState = relations || {};
  return <Modal title={poi ? "Edit point of interest" : "Add a point of interest"} eyebrow={`CURATOR · ${poi ? `POI ${poi.poiId}` : "NEW RECORD"}`} onClose={onClose} wide>
    <form className="form-stack curator-form" onSubmit={submit}>
      <p className="form-note">Common POI details stay separate from subtype details. IDs are generated for this browser-only demonstration.</p>
      <div className="form-section"><h3>Common POI details</h3><div className="form-grid two">
        {field("name", "Name", { placeholder: "Point of interest name" })}
        <Field label="City" required><select value={form.cityId} onChange={(e) => update("cityId", e.target.value)}>{cities.map((city) => <option key={city.cityId} value={city.cityId}>{city.cityName}, {city.state}</option>)}</select></Field>
        {!poi && <Field label="Subtype" required><select value={form.type} onChange={(e) => update("type", e.target.value)}>{Object.entries(TYPE_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></Field>}
        {field("street", "Street / address")}{field("area", "Area / locality")}
        {field("contactNumbers", "Contact numbers", { placeholder: "Separate numbers with commas" })}
        {field("website", "Website", { placeholder: "https://example.org" })}
        {field("openingHours", "Opening hours")}
        {field("image", "Image path", { placeholder: "/images/lalbagh.jpg" })}
        {field("description", "Description", { type: "textarea", wide: true })}
      </div></div>
      <div className="form-section"><h3>{TYPE_LABELS[form.type]} details</h3><div className="form-grid two">
        {form.type === "place" && <>{listField("categories", "Categories")}{field("entryFee", "Entry fee (₹)", { type: "number" })}{field("establishedYear", "Established year", { type: "number" })}{field("accessibilityInfo", "Accessibility information", { type: "textarea", wide: true })}</>}
        {form.type === "restaurant" && <>{listField("cuisines", "Cuisine")}{listField("famousDishes", "Famous dishes")}{field("priceRange", "Price range", { placeholder: "₹₹ · Moderate" })}{listField("diningTypes", "Dining type")}{listField("ambience", "Ambience / aesthetic")}{boolField("deliveryAvailable", "Delivery available")}{boolField("takeawayAvailable", "Takeaway available")}{boolField("reservationAvailable", "Reservation available")}{boolField("outdoorSeating", "Outdoor seating")}{boolField("indoorSeating", "Indoor seating")}{boolField("privateDining", "Private dining")}{boolField("cateringAvailable", "Catering available")}{boolField("parkingAvailable", "Parking available")}{listField("parkingType", "Parking type")}{field("seatingCapacity", "Seating capacity", { type: "number" })}{listField("accessibility", "Accessibility")}{listField("paymentMethods", "Payment methods")}{field("reservationPolicy", "Reservation policy", { type: "textarea" })}{field("cancellationPolicy", "Cancellation policy", { type: "textarea" })}</>}
        {form.type === "activity" && <>{field("activityType", "Activity type")}{<Field label="Difficulty level"><select value={form.difficultyLevel} onChange={(e) => update("difficultyLevel", e.target.value)}><option>Easy</option><option>Moderate</option><option>Challenging</option><option>Advanced</option></select></Field>}{field("duration", "Duration")}{field("cost", "Cost (₹)", { type: "number" })}{field("minimumAge", "Minimum age", { type: "number" })}{field("maximumAge", "Maximum age", { type: "number" })}{listField("seasons", "Season")}{listField("equipmentRequired", "Equipment required")}{field("safetyInformation", "Safety information", { type: "textarea", wide: true })}</>}
        {form.type === "event" && <>{field("eventType", "Event type")}{field("startDate", "Start date", { type: "date" })}{field("endDate", "End date", { type: "date" })}{field("startTime", "Start time", { type: "time" })}{field("endTime", "End time", { type: "time" })}{field("ticketPrice", "Ticket price (₹)", { type: "number" })}{field("organizer", "Organizer")}{field("capacity", "Capacity", { type: "number" })}{boolField("registrationRequired", "Registration required")}</>}
      </div></div>
      <div className="form-section"><h3>Optional relationships</h3><p className="form-hint">These links are stored separately from POI subtype details and can be absent.</p><div className="form-grid two">
        {form.type === "event" && <Field label="Hosted by restaurant"><select value={form.hostRestaurantPoiId} onChange={(e) => update("hostRestaurantPoiId", e.target.value)}><option value="">No host recorded</option>{hostOptions.map((item) => <option key={item.poiId} value={item.poiId}>{item.name}</option>)}</select></Field>}
        {form.type === "activity" && <Field label="Conducted at POIs" className="field-wide"><select multiple size="4" value={parseList(form.activityLocationIds).map(Number).map(String)} onChange={(e) => update("activityLocationIds", Array.from(e.target.selectedOptions, (option) => option.value).join(", "))}>{activityOptions.map((item) => <option key={item.poiId} value={item.poiId}>{item.name}</option>)}</select><small>Use Ctrl/Cmd to select multiple POIs. Leave empty if no location relationship is recorded.</small></Field>}
        <Field label="Nearby POIs" className="field-wide"><select multiple size="4" value={parseList(form.nearbyIds).map(Number).map(String)} onChange={(e) => update("nearbyIds", Array.from(e.target.selectedOptions, (option) => option.value).join(", "))}>{validRelated.map((item) => <option key={item.poiId} value={item.poiId}>{item.name}</option>)}</select><small>Optional many-to-many nearby links; multiple choices are supported.</small></Field>
      </div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel={poi ? "Save POI" : "Add POI"} />
    </form>
  </Modal>;
}


export function ChoosePoiForm({ allPois, cities, itinerary, onSave, onClose }) {
  const [poiId, setPoiId] = useState("");
  const [error, setError] = useState("");
  const available = allPois.filter((poi) => !itinerary?.poiIds.includes(poi.poiId));
  const submit = (event) => {
    event.preventDefault();
    const selected = available.find((poi) => poi.poiId === Number(poiId));
    if (!selected) return setError("Choose a valid point of interest that is not already in this itinerary.");
    onSave(selected.poiId);
  };
  return <Modal title="Add a POI to this itinerary" eyebrow={itinerary?.itineraryName || "ITINERARY MEMBERSHIP"} onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <p className="form-note">Choose an existing POI record. This adds one M:N itinerary–POI membership and does not create a separate schedule entity.</p>
      <Field label="Point of interest" required><select autoFocus value={poiId} onChange={(e) => setPoiId(e.target.value)}><option value="">Choose a POI</option>{available.map((poi) => <option key={poi.poiId} value={poi.poiId}>{poi.name} · {cities.find((city) => city.cityId === poi.cityId)?.cityName} · {TYPE_LABELS[poi.type]}</option>)}</select></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <FormActions onCancel={onClose} submitLabel="Add POI" />
    </form>
  </Modal>;
}
