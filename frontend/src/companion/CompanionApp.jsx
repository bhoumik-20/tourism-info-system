import { useEffect, useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { TYPE_LABELS } from "./demoData.js";
import { loadDemoState, nextPartialNumber, persistDemoState, resetDemoState } from "./demoStore.js";
import { AppShell, Button, Modal } from "./components.jsx";
import { AddToItineraryForm, ChoosePoiForm, CityForm, ItineraryForm, PoiForm, ReviewForm, TripForm } from "./forms.jsx";
import {
  CitiesView,
  CuratorView,
  Dashboard,
  ExploreView,
  ItinerariesView,
  ItineraryDetailView,
  PoiDetailView,
  ReviewsView,
  SavedView,
  TripDetailView,
  TripsView,
} from "./views.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEdge(leftId, rightId) {
  return leftId < rightId ? [leftId, rightId] : [rightId, leftId];
}

export default function CompanionApp() {
  const [state, setState] = useState(loadDemoState);
  const [page, setPage] = useState("home");
  const [exploreCityId, setExploreCityId] = useState(null);
  const [activePoiId, setActivePoiId] = useState(null);
  const [activeTripNo, setActiveTripNo] = useState(null);
  const [activeItineraryNo, setActiveItineraryNo] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");

  const activeUser = state.users.find((item) => item.userId === state.currentUserId);
  const activePoi = state.pois.find((item) => item.poiId === activePoiId) || null;
  const savedCount = state.saved.filter((item) => item.userId === state.currentUserId).length;
  const activeTrip = state.trips.find((item) => item.userId === state.currentUserId && item.tripNo === activeTripNo) || null;
  const activeItinerary = state.itineraries.find((item) => item.userId === state.currentUserId && item.itineraryNo === activeItineraryNo) || null;

  useEffect(() => {
    persistDemoState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function navigate(nextPage) {
    setPage(nextPage);
    if (nextPage !== "explore") setExploreCityId(null);
    setActiveTripNo(null);
    setActiveItineraryNo(null);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  function openCity(cityId) {
    setExploreCityId(cityId);
    setActiveTripNo(null);
    setActiveItineraryNo(null);
    setPage("explore");
  }

  function commit(update, message) {
    setState((current) => (typeof update === "function" ? update(current) : update));
    if (message) setToast(message);
  }

  function toggleSaved(poi) {
    const ownerId = state.currentUserId;
    const exists = state.saved.some((item) => item.userId === ownerId && item.poiId === poi.poiId);
    commit((current) => ({
      ...current,
      saved: exists
        ? current.saved.filter((item) => !(item.userId === ownerId && item.poiId === poi.poiId))
        : [...current.saved, { userId: ownerId, poiId: poi.poiId }],
    }), exists ? "Removed from saved places" : "Saved for later");
  }

  function openCreateTrip() {
    setDialog({ type: "trip" });
  }

  function saveTrip(form) {
    const existing = dialog?.trip;
    if (existing) {
      commit((current) => ({
        ...current,
        trips: current.trips.map((item) => item.userId === existing.userId && item.tripNo === existing.tripNo ? { ...item, ...form } : item),
      }), "Trip updated");
    } else {
      const tripNo = nextPartialNumber(state.trips, state.currentUserId, "tripNo");
      commit((current) => ({ ...current, trips: [...current.trips, { userId: current.currentUserId, tripNo, ...form }] }), "Trip created");
      setActiveTripNo(tripNo);
    }
    setDialog(null);
  }

  function askDeleteTrip(trip) {
    const itineraryCount = state.itineraries.filter((item) => item.userId === trip.userId && item.tripNo === trip.tripNo).length;
    setDialog({
      type: "confirm",
      title: "Delete this trip?",
      message: itineraryCount
        ? `This will also remove ${itineraryCount} itinerary${itineraryCount === 1 ? "" : "ies"} belonging to “${trip.tripName}”. This keeps the trip–itinerary relationship consistent in the local demo.`
        : `“${trip.tripName}” will be removed from this browser's sample data.`,
      onConfirm: () => {
        commit((current) => ({
          ...current,
          trips: current.trips.filter((item) => !(item.userId === trip.userId && item.tripNo === trip.tripNo)),
          itineraries: current.itineraries.filter((item) => !(item.userId === trip.userId && item.tripNo === trip.tripNo)),
        }), "Trip deleted");
        setActiveTripNo(null);
        setPage("trips");
        setDialog(null);
      },
    });
  }

  function openCreateItinerary(defaultTripNo = null) {
    setDialog({ type: "itinerary", defaultTripNo });
  }

  function saveItinerary(form) {
    const existing = dialog?.itinerary;
    if (existing) {
      commit((current) => ({
        ...current,
        itineraries: current.itineraries.map((item) => item.userId === existing.userId && item.itineraryNo === existing.itineraryNo ? { ...item, ...form } : item),
      }), "Itinerary updated");
    } else {
      const itineraryNo = nextPartialNumber(state.itineraries, state.currentUserId, "itineraryNo");
      commit((current) => ({
        ...current,
        itineraries: [...current.itineraries, { userId: current.currentUserId, itineraryNo, ...form, poiIds: [] }],
      }), "Itinerary created");
      setActiveItineraryNo(itineraryNo);
      setPage("itinerary-detail");
    }
    setDialog(null);
  }

  function askDeleteItinerary(itinerary) {
    setDialog({
      type: "confirm",
      title: "Delete this itinerary?",
      message: `“${itinerary.itineraryName}” and its POI memberships will be removed from the local demo. The parent trip remains unchanged.`,
      onConfirm: () => {
        commit((current) => ({
          ...current,
          itineraries: current.itineraries.filter((item) => !(item.userId === itinerary.userId && item.itineraryNo === itinerary.itineraryNo)),
        }), "Itinerary deleted");
        setActiveItineraryNo(null);
        setPage("itineraries");
        setDialog(null);
      },
    });
  }

  function openAddToItinerary(poi) {
    setDialog({ type: "add-poi", poi });
  }

  function addPoiToItinerary(itineraryNo) {
    const poi = dialog?.poi;
    if (!poi) return;
    const itinerary = state.itineraries.find((item) => item.userId === state.currentUserId && item.itineraryNo === itineraryNo);
    if (!itinerary || !state.pois.some((item) => item.poiId === poi.poiId)) {
      setDialog(null);
      setToast("That itinerary or point of interest is no longer available.");
      return;
    }
    if (itinerary.poiIds.includes(poi.poiId)) {
      setToast("This point of interest is already in that itinerary.");
      return;
    }
    commit((current) => ({
      ...current,
      itineraries: current.itineraries.map((item) => item.userId === state.currentUserId && item.itineraryNo === itineraryNo ? { ...item, poiIds: [...item.poiIds, poi.poiId] } : item),
    }), "Added to itinerary");
    setActiveItineraryNo(itineraryNo);
    setPage("itinerary-detail");
    setDialog(null);
  }

  function removePoiFromItinerary(poi) {
    const itineraryNo = activeItineraryNo;
    if (itineraryNo === null) return;
    commit((current) => ({
      ...current,
      itineraries: current.itineraries.map((item) => item.userId === state.currentUserId && item.itineraryNo === itineraryNo ? { ...item, poiIds: item.poiIds.filter((id) => id !== poi.poiId) } : item),
    }), "Removed from itinerary");
  }

  function addCatalogPoiToItinerary(poiId) {
    const itinerary = state.itineraries.find((item) => item.userId === state.currentUserId && item.itineraryNo === activeItineraryNo);
    const poiExists = state.pois.some((item) => item.poiId === poiId);
    if (!itinerary || !poiExists || itinerary.poiIds.includes(poiId)) {
      setToast("That POI is unavailable or already in this itinerary.");
      return;
    }
    commit((current) => ({
      ...current,
      itineraries: current.itineraries.map((item) => item.userId === state.currentUserId && item.itineraryNo === activeItineraryNo ? { ...item, poiIds: [...item.poiIds, poiId] } : item),
    }), "Added to itinerary");
    setDialog(null);
  }

  function openReview(poi = null, review = null) {
    setDialog({ type: "review", poiId: poi?.poiId || null, review });
  }

  function saveReview({ poiId, rating, comment }) {
    const review = dialog?.review;
    if (review && review.userId === state.currentUserId) {
      commit((current) => ({
        ...current,
        reviews: current.reviews.map((item) => item.reviewId === review.reviewId && item.userId === state.currentUserId
          ? { ...item, poiId: Number(poiId), rating, comment, lastUpdated: today() }
          : item),
      }), "Review updated");
    } else {
      const reviewId = state.reviews.reduce((max, item) => Math.max(max, item.reviewId), 0) + 1;
      commit((current) => ({
        ...current,
        reviews: [...current.reviews, { reviewId, userId: current.currentUserId, poiId: Number(poiId), rating, comment, reviewDate: today(), lastUpdated: today() }],
      }), "Review added");
    }
    setActivePoiId(Number(poiId));
    setDialog(null);
  }

  function openCityEditor(city = null) {
    setDialog({ type: "city", city });
  }

  function saveCity(form) {
    const city = dialog?.city;
    if (city) {
      commit((current) => ({ ...current, cities: current.cities.map((item) => item.cityId === city.cityId ? { ...item, ...form } : item) }), "City updated");
    } else {
      const cityId = state.cities.reduce((max, item) => Math.max(max, item.cityId), 0) + 1;
      commit((current) => ({ ...current, cities: [...current.cities, { cityId, ...form }] }), "City added");
    }
    setDialog(null);
  }

  function relationshipsForPoi(poi) {
    const hostRestaurant = state.restaurantEventRelations.find((relation) => relation.eventPoiId === poi.poiId)?.restaurantPoiId;
    return {
      hostRestaurantPoiId: hostRestaurant ? String(hostRestaurant) : "",
      activityLocationIds: state.activityLocationRelations.filter((relation) => relation.activityPoiId === poi.poiId).map((relation) => relation.poiId),
      nearbyIds: state.nearbyRelations.flatMap((relation) => relation.poiId === poi.poiId ? [relation.nearbyPoiId] : relation.nearbyPoiId === poi.poiId ? [relation.poiId] : []),
    };
  }

  function openPoiEditor(poi = null) {
    const source = poi ? { ...poi, _relations: relationshipsForPoi(poi) } : null;
    setDialog({ type: "poi", poi: source });
  }

  function savePoiRecord({ poi, hostRestaurantPoiId, activityLocationIds, nearbyIds }) {
    const existing = dialog?.poi;
    const poiId = existing?.poiId || state.pois.reduce((max, item) => Math.max(max, item.poiId), 0) + 1;
    const finalPoi = { ...poi, poiId };
    commit((current) => {
      const pois = existing
        ? current.pois.map((item) => item.poiId === poiId ? finalPoi : item)
        : [...current.pois, finalPoi];
      const restaurantEventRelations = current.restaurantEventRelations.filter((item) => item.eventPoiId !== poiId);
      const hostId = Number(hostRestaurantPoiId);
      if (finalPoi.type === "event" && hostRestaurantPoiId && pois.some((item) => item.poiId === hostId && item.type === "restaurant")) {
        restaurantEventRelations.push({ restaurantPoiId: hostId, eventPoiId: poiId });
      }
      const activityLocationRelations = current.activityLocationRelations.filter((item) => item.activityPoiId !== poiId);
      if (finalPoi.type === "activity") {
        for (const locationId of activityLocationIds) {
          if (locationId !== poiId && pois.some((item) => item.poiId === locationId)) activityLocationRelations.push({ activityPoiId: poiId, poiId: locationId });
        }
      }
      const nearbyRelations = current.nearbyRelations.filter((item) => item.poiId !== poiId && item.nearbyPoiId !== poiId);
      const seen = new Set();
      for (const otherId of nearbyIds) {
        if (otherId === poiId || !pois.some((item) => item.poiId === otherId)) continue;
        const [left, right] = normalizeEdge(poiId, otherId);
        const key = `${left}:${right}`;
        if (seen.has(key)) continue;
        seen.add(key);
        nearbyRelations.push({ poiId: left, nearbyPoiId: right });
      }
      return { ...current, pois, restaurantEventRelations, activityLocationRelations, nearbyRelations };
    }, existing ? "Point of interest updated" : "Point of interest added");
    setDialog(null);
  }

  function resetDemo() {
    setDialog({
      type: "confirm",
      title: "Reset this browser's sample data?",
      message: "This restores the original sample cities, POIs, reviews, saved items, trips, and itineraries. It does not affect a server or shared database.",
      onConfirm: () => {
        commit(resetDemoState(), "Sample data reset");
        setActivePoiId(null);
        setActiveTripNo(null);
        setActiveItineraryNo(null);
        setPage("home");
        setDialog(null);
      },
    });
  }

  const userItineraries = useMemo(() => state.itineraries
    .filter((item) => item.userId === state.currentUserId)
    .map((item) => ({ ...item, tripName: state.trips.find((trip) => trip.userId === item.userId && trip.tripNo === item.tripNo)?.tripName || "Trip" })), [state.itineraries, state.trips, state.currentUserId]);

  function editTrip(trip) {
    setDialog({ type: "trip", trip });
  }

  function editItinerary(itinerary) {
    setDialog({ type: "itinerary", itinerary });
  }

  const common = {
    state,
    onOpenPoi: (poi) => setActivePoiId(poi.poiId),
    onSavePoi: toggleSaved,
    onAddPoi: openAddToItinerary,
  };

  let content;
  if (page === "home") {
    content = <Dashboard {...common} onNavigate={navigate} onOpenCity={openCity} />;
  } else if (page === "cities") {
    content = <CitiesView state={state} onOpenCity={openCity} />;
  } else if (page === "explore") {
    content = <ExploreView key={exploreCityId ?? "all"} state={state} initialCityId={exploreCityId} {...common} />;
  } else if (page === "saved") {
    content = <SavedView {...common} onNavigate={navigate} />;
  } else if (page === "reviews") {
    content = <ReviewsView state={state} onOpenPoi={(poi) => setActivePoiId(poi.poiId)} onWriteReview={(poi) => openReview(poi)} onEditReview={openReview} />;
  } else if (page === "trips") {
    content = <TripsView state={state} onCreateTrip={openCreateTrip} onEditTrip={editTrip} onDeleteTrip={askDeleteTrip} onOpenTrip={(trip) => { setActiveTripNo(trip.tripNo); setPage("trip-detail"); }} />;
  } else if (page === "trip-detail") {
    content = <TripDetailView state={state} trip={activeTrip} onBack={() => navigate("trips")} onEditTrip={editTrip} onDeleteTrip={askDeleteTrip} onCreateItinerary={openCreateItinerary} onOpenItinerary={(itinerary) => { setActiveItineraryNo(itinerary.itineraryNo); setPage("itinerary-detail"); }} onEditItinerary={editItinerary} onDeleteItinerary={askDeleteItinerary} />;
  } else if (page === "itineraries") {
    content = <ItinerariesView state={state} onCreate={() => openCreateItinerary()} onOpen={(itinerary) => { setActiveItineraryNo(itinerary.itineraryNo); setPage("itinerary-detail"); }} onEdit={editItinerary} onDelete={askDeleteItinerary} />;
  } else if (page === "itinerary-detail") {
    content = <ItineraryDetailView state={state} itinerary={activeItinerary} onBack={() => navigate("itineraries")} onEdit={editItinerary} onDelete={askDeleteItinerary} onAddPoi={() => setDialog({ type: "choose-poi" })} onRemovePoi={removePoiFromItinerary} onOpenPoi={(poi) => setActivePoiId(poi.poiId)} />;
  } else {
    content = <CuratorView state={state} onAddCity={() => openCityEditor()} onEditCity={openCityEditor} onAddPoi={() => openPoiEditor()} onEditPoi={openPoiEditor} onOpenPoi={(poi) => setActivePoiId(poi.poiId)} />;
  }

  return <AppShell page={page === "trip-detail" ? "trips" : page === "itinerary-detail" ? "itineraries" : page} onNavigate={navigate} user={activeUser} savedCount={savedCount} tripCount={state.trips.filter((item) => item.userId === state.currentUserId).length} toast={toast} onReset={resetDemo}>
    {content}
    {activePoi && <PoiDetailView state={state} poi={activePoi} onClose={() => setActivePoiId(null)} onSave={toggleSaved} onAdd={openAddToItinerary} onReview={openReview} onEditReview={openReview} onOpenRelated={(poi) => setActivePoiId(poi.poiId)} />}
    {dialog?.type === "trip" && <TripForm trip={dialog.trip} onSave={saveTrip} onClose={() => setDialog(null)} />}
    {dialog?.type === "itinerary" && <ItineraryForm itinerary={dialog.itinerary} trips={state.trips.filter((item) => item.userId === state.currentUserId)} defaultTripNo={dialog.defaultTripNo} onSave={saveItinerary} onClose={() => setDialog(null)} />}
    {dialog?.type === "add-poi" && <AddToItineraryForm poi={dialog.poi} itineraries={userItineraries} onSave={addPoiToItinerary} onClose={() => setDialog(null)} />}
    {dialog?.type === "review" && <ReviewForm poi={state.pois.find((item) => item.poiId === dialog.poiId) || null} pois={state.pois} review={dialog.review} onSave={saveReview} onClose={() => setDialog(null)} />}
    {dialog?.type === "choose-poi" && <ChoosePoiForm allPois={state.pois} cities={state.cities} itinerary={activeItinerary} onSave={addCatalogPoiToItinerary} onClose={() => setDialog(null)} />}
    {dialog?.type === "city" && <CityForm city={dialog.city} onSave={saveCity} onClose={() => setDialog(null)} />}
    {dialog?.type === "poi" && <PoiForm poi={dialog.poi} cities={state.cities} allPois={state.pois} onSave={savePoiRecord} onClose={() => setDialog(null)} />}
    {dialog?.type === "confirm" && <Modal title={dialog.title} eyebrow="CONFIRM ACTION" onClose={() => setDialog(null)}><div className="confirm-content"><p>{dialog.message}</p><div className="form-actions"><Button variant="secondary" onClick={() => setDialog(null)}>Keep it</Button><Button variant="danger" onClick={dialog.onConfirm}><Trash2 size={15} /> Confirm</Button></div></div></Modal>}
  </AppShell>;
}
