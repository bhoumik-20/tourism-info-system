import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Users, Map, Compass } from "lucide-react";

const checks = [
  ["Create and switch profiles", "Create a profile from the top-right menu. Switch to another profile and back. Check that saves and trips follow the selected name.", "/profile", "Open profile"],
  ["Discover a destination", "Search for a place, filter by city, then open its details. Check the photos, location and reviews.", "/explore", "Explore destinations"],
  ["Browse the six collections", "Open each collection and try its city filter. Use Save and Add to itinerary on a POI card.", "/collections", "Browse collections"],
  ["Save and review a POI", "Save a destination and find it in Saved. Write a review under your selected profile, then edit or delete your own review.", "/saved", "View saved POIs"],
  ["Plan a trip", "Create a Planned trip and an itinerary inside its dates. Add destinations from Explore or a collection, then check the trip dashboard counts.", "/trips", "Open my trips"],
  ["Check date validation", "Try an itinerary outside its parent trip dates, or an event outside the itinerary dates. The change should be rejected with a clear message.", "/trips", "Check a trip"],
];

export default function TeamTesting() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("voyage-team-checks-v1")) || []; } catch { return []; }
  });
  function toggle(index) {
    const next = done.includes(index) ? done.filter(item => item !== index) : [...done, index];
    setDone(next);
    localStorage.setItem("voyage-team-checks-v1", JSON.stringify(next));
  }
  return <section className="container collections-page">
    <div className="page-heading"><p className="eyebrow">TEAM TESTING</p><h1>Take Voyage for a spin.</h1><p>Follow a traveler’s journey, from discovery to a trip ready to go.</p><span className="badge"><CheckCircle2 size={15} /> {done.length} of {checks.length} checked</span></div>
    <div className="collection-card" style={{ marginBottom: 24, display: "flex", gap: 16 }}><Users size={25} style={{ flexShrink: 0 }} /><div><strong>You’re using our shared classroom database.</strong><p style={{ marginBottom: 0 }}>Create a clearly named test profile and use it for your checks. Changes are visible to other teammates. Keep test trips Planned so they can be cleaned up; completed trips are locked by the database.</p></div></div>
    <div className="collection-grid">{checks.map(([title, description, path, label], index) => <article className="collection-card" key={title} style={{ padding: 24 }}>
      <label style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={done.includes(index)} onChange={() => toggle(index)} /><h2 style={{ fontSize: "1.1rem", margin: 0 }}>{title}</h2></label>
      <p style={{ margin: "16px 0", lineHeight: 1.7 }}>{description}</p><Link className="button secondary small" to={path}>{label}</Link>
    </article>)}</div>
    <p className="muted" style={{ marginTop: 24 }}><Map size={16} style={{ verticalAlign: "middle" }} /> This checklist is saved on your browser. The app’s profiles, reviews, saves and trip plans are saved in Oracle.</p>
    <p className="muted"><Compass size={16} style={{ verticalAlign: "middle" }} /> If the database is unavailable, ask the project owner to keep their PC and testing connection running, then try again.</p>
  </section>;
}
