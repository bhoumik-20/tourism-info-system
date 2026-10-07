import { Link } from "react-router-dom";
import { Bookmark, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import POICard from "../components/POICard";
import { EmptyState } from "../components/UI";
export default function Saved() {
  const { data } = useApp();
  const pois = data.catalog.filter((p) => data.saved.includes(p.poiId));
  return (
    <div className="container saved-page">
      <div className="page-heading">
        <p className="eyebrow">
          <Bookmark size={14} />
          YOUR LITTLE COLLECTION
        </p>
        <h1>Keep a little inspiration.</h1>
        <p>The places you want to come back to, all in one spot.</p>
      </div>
      <div className="results-toolbar">
        <p>
          <strong>{pois.length}</strong> saved{" "}
          {pois.length === 1 ? "discovery" : "discoveries"}
        </p>
        <Link className="text-link" to="/trips">
          Bring them into a trip <ArrowRight size={16} />
        </Link>
      </div>
      {pois.length ? (
        <div className="poi-grid home-grid">
          {pois.map((p) => (
            <POICard poi={p} key={p.poiId} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your collection starts with curiosity"
          text="Save a place while exploring. You’ll find it here when you’re ready to plan."
        >
          <Link className="button primary" to="/explore">
            Find your first discovery
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
