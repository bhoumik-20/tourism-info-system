import { SlidersHorizontal } from "lucide-react";
import { useApp } from "../context/AppContext";
import { filterValues } from "../services/catalog.js";

function SelectFilter({ name, label, filters, change, options }) {
  return (
    <label className="filter-field">
      {label}
      <select
        value={filters[name] || ""}
        onChange={(e) => change(name, e.target.value)}
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
export default function FilterPanel({ resource, filters, change, clear }) {
  const { data } = useApp();
  const options = (field) => filterValues(data.catalog, field, resource);
  return (
    <aside className="filter-panel" aria-label="Search filters">
      <div className="filter-heading">
        <h2>
          <SlidersHorizontal size={17} />
          Filters
        </h2>
        <button className="text-button" onClick={clear}>
          Reset all
        </button>
      </div>
      <fieldset>
        <legend>Destination</legend>
        {[
          ["", "All destinations"],
          ...data.cities.map((c) => [String(c.cityId), c.cityName]),
        ].map(([value, label]) => (
          <label className="radio-label" key={value}>
            <input
              type="radio"
              name="city"
              value={value}
              checked={(filters.city || "") === value}
              onChange={() => change("city", value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <SelectFilter
        name="minRating"
        label="Minimum rating"
        filters={filters}
        change={change}
        options={["3", "4", "4.5"]}
      />
      {resource === "pois" && (
        <SelectFilter
          name="type"
          label="POI type"
          filters={filters}
          change={change}
          options={["places", "restaurants", "activities", "events"]}
        />
      )}
      {resource === "restaurants" && (
        <>
          <SelectFilter
            name="cuisine"
            label="Cuisine"
            filters={filters}
            change={change}
            options={options("cuisines")}
          />
          <SelectFilter
            name="priceRange"
            label="Price range"
            filters={filters}
            change={change}
            options={options("priceRange")}
          />
          <label className="radio-label">
            <input
              type="checkbox"
              checked={filters.delivery === "Y"}
              onChange={(e) => change("delivery", e.target.checked ? "Y" : "")}
            />
            Delivery available
          </label>
          <label className="radio-label">
            <input
              type="checkbox"
              checked={filters.parking === "Y"}
              onChange={(e) => change("parking", e.target.checked ? "Y" : "")}
            />
            Parking available
          </label>
        </>
      )}
      {resource === "activities" && (
        <>
          <SelectFilter
            name="activityType"
            label="Activity type"
            filters={filters}
            change={change}
            options={options("activityType")}
          />
          <SelectFilter
            name="difficulty"
            label="Difficulty"
            filters={filters}
            change={change}
            options={options("difficultyLevel")}
          />
          <SelectFilter
            name="season"
            label="Season"
            filters={filters}
            change={change}
            options={options("seasons")}
          />
          <label className="filter-field">
            Maximum cost (₹)
            <input
              type="number"
              min="0"
              step="1"
              value={filters.maxCost || ""}
              onChange={(e) => change("maxCost", e.target.value)}
              placeholder="Any budget"
            />
          </label>
        </>
      )}
      {resource === "events" && (
        <>
          <SelectFilter
            name="eventType"
            label="Event type"
            filters={filters}
            change={change}
            options={options("eventType")}
          />
          <label className="filter-field">
            From
            <input
              type="date"
              value={filters.from || ""}
              onInput={(e) => change("from", e.target.value)}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label className="filter-field">
            To
            <input
              type="date"
              min={filters.from || undefined}
              value={filters.to || ""}
              onInput={(e) => change("to", e.target.value)}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
        </>
      )}
      <div className="filter-note">
        A new favourite is waiting around the corner.
      </div>
    </aside>
  );
}
