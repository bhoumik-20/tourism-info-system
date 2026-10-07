import { useEffect, useRef } from "react";
import { Compass, LoaderCircle, X, Star, Search } from "lucide-react";
import { imageFor } from "../data/images";

export function Rating({ value, count }) {
  return (
    <span className="rating">
      <Star size={13} fill={value ? "currentColor" : "none"} />
      <strong>{value ? Number(value).toFixed(1) : "New"}</strong>
      {count !== undefined && (
        <span className="rating-count">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </span>
  );
}
export function Photo({ poi, className = "", eager = false, credit = false }) {
  const image = imageFor(poi);
  return (
    <div className={`photo ${className}`}>
      {image ? (
        <>
          <img
            src={image.src}
            alt={poi.name}
            loading={eager ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.hidden = true;
              e.currentTarget.parentElement.classList.add("image-unavailable");
            }}
          />
          <span className="image-error">Photo unavailable</span>
          {credit === "inline" ? (
            <span className="photo-credit">
              {image.credit} · {image.license}
            </span>
          ) : (
            credit && (
              <a
                className="photo-credit"
                href={image.url}
                target="_blank"
                rel="noreferrer"
              >
                {image.credit} · {image.license}
              </a>
            )
          )}
        </>
      ) : (
        <div className={`photo-placeholder ${poi.type || "places"}`}>
          <Compass size={44} strokeWidth={1} />
          <span>{poi.cityName || "Discover a little more"}</span>
          <small>{poi.name}</small>
        </div>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      Loading your next discovery…
    </div>
  );
}
export function ErrorMessage({ children }) {
  return children ? (
    <p className="error-message" role="alert">
      {children}
    </p>
  ) : null;
}
export function EmptyState({ title, text, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Compass size={30} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search places, experiences and more…",
  label = "Search points of interest",
  action = "Search",
}) {
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search size={20} aria-hidden="true" />
      <label
        className="sr-only"
        htmlFor={`search-${label.replaceAll(" ", "-")}`}
      >
        {label}
      </label>
      <input
        id={`search-${label.replaceAll(" ", "-")}`}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={150}
      />
      <button className="button primary" type="submit">
        {action}
      </button>
    </form>
  );
}
export function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => {
    const node = dialog.current;
    const previous = opener.current;
    node.showModal();
    node.querySelector("input, select, textarea")?.focus();
    return () => {
      node.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const rect = dialog.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function dateLabel(date) {
  return date
    ? new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Dates to be decided";
}
export function money(value) {
  return value == null
    ? "Price not listed"
    : Number(value) === 0
      ? "Free"
      : `₹${Number(value).toLocaleString("en-IN")}`;
}
