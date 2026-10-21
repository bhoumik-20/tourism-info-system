import React from "react";
import {
  Activity,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  Route,
  Search,
  Star,
  Utensils,
  X,
} from "lucide-react";
import { TYPE_COLORS, TYPE_LABELS } from "./demoData.js";

const navigation = [
  ["home", "Overview", LayoutDashboard],
  ["cities", "Explore cities", MapPin],
  ["explore", "Points of interest", Compass],
  ["saved", "Saved places", Bookmark],
  ["reviews", "Reviews", Star],
  ["trips", "My trips", Route],
  ["itineraries", "Itineraries", CalendarDays],
  ["curator", "Content curator", Utensils],
];

export function AppShell({
  page,
  onNavigate,
  user,
  savedCount,
  tripCount,
  children,
  toast,
  onReset,
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const fullName = [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Compass size={22} strokeWidth={2.1} /></div>
          <div><strong>Voyage</strong><span>TRAVELLING COMPANION</span></div>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="sidebar-label">YOUR TRAVEL DESK</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(([key, label, Icon]) => (
            <button
              className={`side-link ${page === key ? "active" : ""}`}
              key={key}
              onClick={() => { onNavigate(key); setMobileOpen(false); }}
              aria-current={page === key ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {key === "saved" && savedCount > 0 && <span className="nav-count">{savedCount}</span>}
              {key === "trips" && tripCount > 0 && <span className="nav-count">{tripCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note"><span className="demo-dot" /> Frontend demo <small>Sample data · saved in this browser</small></div>
          <button className="reset-link" onClick={onReset}>Reset sample data</button>
          <div className="sidebar-profile">
            <div className="avatar">{user?.firstName?.[0] || "T"}</div>
            <div className="profile-copy"><strong>{fullName || "Traveler"}</strong><span>Traveler profile</span></div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Travelling Companion</span><span className="crumb-divider">/</span><strong>{navigation.find(([key]) => key === page)?.[1] || "Overview"}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><span /> LOCAL DEMO</span><div className="topbar-avatar">{user?.firstName?.[0] || "T"}</div></div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="app-footer"><span>Travelling Companion · DBMS project demonstration</span><span>Changes are stored locally in this browser only.</span></footer>
      </div>
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}

export function PageHeading({ eyebrow, title, text, action, className = "" }) {
  return (
    <div className={`page-heading ${className}`}>
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{text && <p className="page-lede">{text}</p>}</div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, action }) {
  return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>;
}

export function Button({ children, variant = "primary", size = "", ...props }) {
  return <button className={`button ${variant} ${size}`.trim()} {...props}>{children}</button>;
}

export function Modal({ title, eyebrow, onClose, children, wide = false }) {
  React.useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal-panel ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ icon: Icon = Search, title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={23} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function TypeBadge({ type }) {
  return <span className={`type-badge ${TYPE_COLORS[type] || "mint"}`}>{TYPE_LABELS[type] || "Point of interest"}</span>;
}

export function Rating({ value, count, compact = false }) {
  return <span className={`rating ${compact ? "rating-compact" : ""}`} title={count ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}><Star size={15} fill={value ? "currentColor" : "none"} /><strong>{value ? Number(value).toFixed(1) : "—"}</strong>{!compact && <span>{count ? `(${count})` : "No reviews"}</span>}</span>;
}

export function PoiCard({ poi, cityName, rating, reviewCount, saved, onOpen, onSave, onAdd }) {
  const typeColor = TYPE_COLORS[poi.type] || "mint";
  const SummaryIcon = poi.type === "restaurant" ? Utensils : poi.type === "activity" ? Activity : poi.type === "event" ? CalendarDays : MapPin;
  const summary = poi.type === "place" ? (poi.categories || []).slice(0, 2).join(" · ") : poi.type === "restaurant" ? (poi.cuisines || []).join(" · ") : poi.type === "activity" ? poi.activityType : poi.eventType;
  return (
    <article className="poi-card">
      <button className="poi-card-image" onClick={onOpen} aria-label={`View ${poi.name}`} style={poi.image ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(18, 36, 32, .28)), url("${poi.image}")` } : undefined}>
        {!poi.image && <span className={`image-placeholder ${typeColor}`}><SummaryIcon size={29} strokeWidth={1.4} /></span>}
        <TypeBadge type={poi.type} />
        <span className="image-city">{cityName}</span>
      </button>
      <div className="poi-card-body">
        <div className="poi-title-row"><button className="poi-title" onClick={onOpen}>{poi.name}</button><Rating value={rating} count={reviewCount} compact /></div>
        <p className="poi-summary">{summary || cityName}</p>
        <p className="poi-description">{poi.description}</p>
        <div className="poi-card-footer">
          <span className="poi-price">{poi.type === "restaurant" ? poi.priceRange : poi.type === "activity" ? money(poi.cost) : poi.type === "event" ? money(poi.ticketPrice) : poi.entryFee === 0 ? "Free entry" : money(poi.entryFee)}</span>
          <div className="card-actions"><button className={`icon-action ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={saved ? `Remove ${poi.name} from saved places` : `Save ${poi.name}`}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button><button className="card-add" onClick={onAdd}><Plus size={15} /> Add to plan</button></div>
        </div>
      </div>
    </article>
  );
}

export function money(value) {
  if (value === null || value === undefined || value === "") return "Ask for price";
  return Number(value) === 0 ? "Free" : `₹${Number(value).toLocaleString("en-IN")}`;
}

export function dateLabel(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleDateString("en-IN", options);
}

export function Field({ label, required, hint, children, className = "" }) {
  return <label className={`form-field ${className}`}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function FormActions({ onCancel, submitLabel = "Save changes", busy = false }) {
  return <div className="form-actions"><Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button></div>;
}
