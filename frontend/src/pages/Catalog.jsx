import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, SlidersHorizontal, X, List } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import FilterPanel from "../components/FilterPanel";
import POICard from "../components/POICard";
import { SearchBar, Loading, EmptyState, ErrorMessage } from "../components/UI";

const copy = {
  pois: [
    "Explore the city",
    "Follow your curiosity.",
    "Discover remarkable places, local flavours and new experiences.",
  ],
  restaurants: [
    "Restaurants",
    "Good food. Great memories.",
    "From timeless breakfast spots to neighbourhood favourites, find your next table.",
  ],
  activities: [
    "Activities",
    "A little adventure awaits.",
    "Make room for a new experience, a fresh perspective or a slower morning.",
  ],
  events: [
    "Events",
    "Be part of the moment.",
    "Find the gatherings, performances and celebrations that bring a city together.",
  ],
};
const allowed = {
  pois: ["search", "city", "minRating", "type"],
  restaurants: [
    "search",
    "city",
    "minRating",
    "cuisine",
    "priceRange",
    "delivery",
    "parking",
  ],
  activities: [
    "search",
    "city",
    "minRating",
    "activityType",
    "difficulty",
    "season",
    "maxCost",
  ],
  events: ["search", "city", "minRating", "eventType", "from", "to"],
};
export default function Catalog({ resource = "pois" }) {
  const { data, revision } = useApp();
  const [params, setParams] = useSearchParams();
  const pendingParams = useRef(params);
  useEffect(() => {
    pendingParams.current = params;
  }, [params]);
  const filters = Object.fromEntries(
    [...params].filter(([key]) => allowed[resource].includes(key)),
  );
  const serialized = JSON.stringify(filters);
  const [search, setSearch] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("name");
  const [visible, setVisible] = useState(12);
  useEffect(() => {
    setSearch(params.get("search") || "");
    setVisible(12);
  }, [serialized, resource]);
  const invalidDates = filters.from && filters.to && filters.to < filters.from;
  const result = useAsync(
    () =>
      invalidDates
        ? Promise.reject(
            new Error("The end date must be on or after the start date."),
          )
        : api.listPois(resource, filters),
    [resource, serialized, revision],
  );
  function change(key, value) {
    const next = new URLSearchParams(pendingParams.current);
    if (value) next.set(key, value);
    else next.delete(key);
    pendingParams.current = next;
    setParams(next, { replace: true });
  }
  function clear() {
    pendingParams.current = new URLSearchParams();
    setParams({});
  }
  const records = (result.data || []).map((p) => ({
    ...data.catalog.find((c) => c.poiId === p.poiId),
    ...p,
  }));
  records.sort(
    sort === "rating"
      ? (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
      : (a, b) => a.name.localeCompare(b.name),
  );
  const [label, title, description] = copy[resource];
  return (
    <div className="container catalogue">
      <div className="page-heading">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <SearchBar
        value={search}
        onChange={setSearch}
        onSubmit={() => change("search", search.trim())}
        placeholder={`Search ${resource === "pois" ? "points of interest" : resource}…`}
      />
      <button
        className="button secondary filter-toggle"
        aria-expanded={showFilters}
        onClick={() => setShowFilters(!showFilters)}
      >
        <SlidersHorizontal size={17} />
        {showFilters ? "Hide filters" : "Show filters"}
      </button>
      <div className="catalogue-layout">
        <div className={`filter-wrapper ${showFilters ? "open" : ""}`}>
          <FilterPanel
            resource={resource}
            filters={filters}
            change={change}
            clear={clear}
          />
        </div>
        <section className="results" aria-label="Search results">
          <div className="results-toolbar">
            <p aria-live="polite">
              {result.loading ? (
                "Finding your next discovery…"
              ) : (
                <>
                  <strong>{records.length}</strong>{" "}
                  {records.length === 1 ? "discovery" : "discoveries"}
                  {filters.city
                    ? ` in ${data.cities.find((c) => String(c.cityId) === filters.city)?.cityName || "this destination"}`
                    : " to explore"}
                </>
              )}
            </p>
            <div className="results-controls">
              <label className="sr-only" htmlFor="sort">
                Sort results
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="name">Name: A–Z</option>
                <option value="rating">Highest rated</option>
              </select>
              <div className="view-switch">
                <button
                  className={`icon-button ${view === "grid" ? "active" : ""}`}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  className={`icon-button ${view === "list" ? "active" : ""}`}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>
          {Object.keys(filters).length > 0 && (
            <div className="active-filters">
              {Object.entries(filters).map(([key, value]) => (
                <button
                  className="filter-chip"
                  key={key}
                  onClick={() => change(key, "")}
                >
                  {key === "city"
                    ? data.cities.find((c) => String(c.cityId) === value)
                        ?.cityName || value
                    : `${key.replace(/([A-Z])/g, " $1")}: ${value}`}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <ErrorMessage>{result.error}</ErrorMessage>
          ) : !records.length ? (
            <EmptyState
              title="A different discovery is waiting"
              text="Try another search or loosen a filter to find something new."
            >
              <button className="button secondary" onClick={clear}>
                Clear filters
              </button>
            </EmptyState>
          ) : (
            <>
              <div className={`poi-grid ${view === "list" ? "list-view" : ""}`}>
                {records.slice(0, visible).map((p) => (
                  <POICard key={p.poiId} poi={p} />
                ))}
              </div>
              {visible < records.length && (
                <div className="load-more">
                  <button
                    className="button secondary"
                    onClick={() => setVisible((v) => v + 12)}
                  >
                    Show more discoveries
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
