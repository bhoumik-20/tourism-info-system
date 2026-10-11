import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import PoiDetail from "./pages/PoiDetail";
import Saved from "./pages/Saved";
import { Trips, TripDetail } from "./pages/Plans";
import Itinerary from "./pages/Itinerary";
import Credits from "./pages/Credits";
import Profile from "./pages/Profile";
import { EmptyState } from "./components/UI";

function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const label =
      pathname === "/"
        ? "Discover Bengaluru & Mumbai"
        : pathname.split("/")[1].replace(/^pois$/, "Place details");
    document.title = `${label.charAt(0).toUpperCase() + label.slice(1)} · Voyage`;
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <PageTitle />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Catalog key="pois" />} />
            <Route
              path="restaurants"
              element={<Catalog key="restaurants" resource="restaurants" />}
            />
            <Route
              path="activities"
              element={<Catalog key="activities" resource="activities" />}
            />
            <Route
              path="events"
              element={<Catalog key="events" resource="events" />}
            />
            <Route path="pois/:id" element={<PoiDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="saved" element={<Saved />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/:tripNo" element={<TripDetail />} />
            <Route path="itineraries/:id" element={<Itinerary />} />
            <Route path="credits" element={<Credits />} />
            <Route
              path="*"
              element={
                <EmptyState
                  title="A little off the beaten path"
                  text="This page doesn’t exist, but your next discovery is just a click away."
                >
                  <Link className="button primary" to="/explore">
                    Back to explore
                  </Link>
                </EmptyState>
              }
            />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
