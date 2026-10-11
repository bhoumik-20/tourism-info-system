import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Compass, Menu, X, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { EmptyState, Loading } from "./UI";
import { ProfileControl, ProfileDialogs } from "./Profiles";

const navigation = [
  ["/", "Home"],
  ["/explore", "Explore"],
  ["/collections", "Collections"],
  ["/restaurants", "Restaurants"],
  ["/activities", "Activities"],
  ["/events", "Events"],
  ["/saved", "Saved"],
  ["/trips", "My trips"],
];
export default function Layout() {
  const { data, loading, error, userId, setUserId, toast, isDemo, retry } =
    useApp();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="navbar">
        <div className="nav-inner">
          <Link className="brand" to="/" aria-label="Voyage home">
            <span className="brand-icon">
              <Compass size={23} />
            </span>
            Voyage<span className="brand-dot">.</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className={`nav-links ${menu ? "is-open" : ""}`}
          >
            {navigation.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-user"><ProfileControl /></div>
          <button
            className="icon-button mobile-menu"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main" className="main-content">
        {error ? (
          <EmptyState title="We couldn’t load your travel guide" text={error}>
            <button className="button primary" onClick={retry}>
              Try again
            </button>
          </EmptyState>
        ) : !data ? (
          <Loading />
        ) : (
          <Outlet key={userId || "guest"} />
        )}
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Link className="brand footer-brand" to="/">
              <Compass size={22} />
              Voyage.
            </Link>
            <p>Your next discovery starts here.</p>
          </div>
          <div className="footer-links">
            <Link to="/explore">
              Explore destinations <ArrowUpRight size={14} />
            </Link>
            <Link to="/trips">
              Plan a trip <ArrowUpRight size={14} />
            </Link>
            <Link to="/credits">
              Photography credits <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="footer-note">
            <span>
              {isDemo
                ? "Demo data · saved on this browser"
                : error
                  ? "Tourism database unavailable"
                  : loading
                    ? "Connecting to your tourism database…"
                    : "Connected to your tourism database"}
            </span>
            <span>Tourism Information System · BACSE202</span>
          </div>
        </div>
      </footer>
      <ProfileDialogs />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
