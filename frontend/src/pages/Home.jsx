import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Landmark,
  Utensils,
  Bike,
  CalendarDays,
  Bookmark,
  Route,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import POICard from "../components/POICard";
import { SearchBar, Photo } from "../components/UI";

const categories = [
  {
    to: "/explore?type=places",
    label: "Places to discover",
    text: "Landmarks, gardens & hidden gems",
    icon: Landmark,
    type: "places",
  },
  {
    to: "/restaurants",
    label: "Flavours to remember",
    text: "Local favourites & iconic dining",
    icon: Utensils,
    type: "restaurants",
  },
  {
    to: "/activities",
    label: "Experiences to try",
    text: "A little adventure, your way",
    icon: Bike,
    type: "activities",
  },
  {
    to: "/events",
    label: "Moments to be part of",
    text: "Culture, community & celebration",
    icon: CalendarDays,
    type: "events",
  },
];
export default function Home() {
  const { data } = useApp();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const gateway =
    data.catalog.find((p) => /^gateway of india$/i.test(p.name)) ||
    data.catalog[0];
  const mumbaiId = data.cities.find((c) => c.cityName === "Mumbai")?.cityId;
  const featured = data.catalog
    .filter((p) =>
      /^(Lalbagh Botanical Garden|Bangalore Palace|Bengaluru Palace|Gateway of India|Marine Drive)$/i.test(
        p.name,
      ),
    )
    .slice(0, 4);
  return (
    <div className="container home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-dot" />
            BENGALURU & MUMBAI
          </span>
          <h1>
            A new city.
            <br />A thousand
            <br />
            <span>little discoveries.</span>
          </h1>
          <p>
            Find the places, flavours and experiences that make a city yours.
            Your next adventure starts with a little curiosity.
          </p>
          <SearchBar
            value={search}
            onChange={setSearch}
            onSubmit={() =>
              navigate(
                `/explore${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`,
              )
            }
            placeholder="Where will curiosity take you?"
            action="Explore"
          />
          <div className="hero-footnote">
            <MapPin size={15} />
            Two remarkable cities. Endless ways to explore.
          </div>
        </div>
        <div className="hero-visual">
          {gateway && <Photo poi={gateway} eager credit />}
          <div className="hero-caption">
            <span className="eyebrow">YOUR NEXT STOP</span>
            <h2>Discover Mumbai</h2>
            <Link to={mumbaiId ? `/explore?city=${mumbaiId}` : "/explore"}>
              Follow the sea breeze <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="category-grid" aria-label="Explore categories">
        {categories.map(({ to, label, text, icon: Icon, type }) => (
          <Link key={to} to={to} className="category-card">
            <span className={`category-icon ${type}`}>
              <Icon size={24} />
            </span>
            <div>
              <h2>{label}</h2>
              <p>{text}</p>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">START WITH THE ICONS</p>
            <h2>Some places stay with you.</h2>
            <p>
              Discover the city’s landmarks and make a few memories along the
              way.
            </p>
          </div>
          <Link className="text-link" to="/explore">
            Explore all places <ArrowRight size={17} />
          </Link>
        </div>
        <div className="poi-grid home-grid">
          {(featured.length ? featured : data.catalog.slice(0, 4)).map((p) => (
            <POICard poi={p} key={p.poiId} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TWO CITIES, TWO STORIES</p>
            <h2>Where do you want to begin?</h2>
          </div>
        </div>
        <div className="destination-grid">
          {data.cities.map((city) => (
            <Link
              className="destination-card"
              to={`/explore?city=${city.cityId}`}
              key={city.cityId}
            >
              <Photo
                poi={{
                  name:
                    city.cityName === "Mumbai"
                      ? "Gateway of India"
                      : "Lalbagh Botanical Garden",
                }}
                credit="inline"
              />
              <div>
                <span className="eyebrow">{city.state || "INDIA"}</span>
                <h3>{city.cityName}</h3>
                <p>
                  {city.description ||
                    "Find your next favourite corner of the city."}
                </p>
                <span className="text-link">
                  Explore {city.cityName} <ArrowRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="planning-banner">
        <span className="planning-icon">
          <Route size={31} />
        </span>
        <div>
          <p className="eyebrow">MAKE IT YOUR OWN</p>
          <h2>A great trip starts with a small plan.</h2>
          <p>
            Save what catches your eye. Bring it all together in your own
            itinerary.
          </p>
        </div>
        <Link className="button primary" to="/trips">
          Plan my trip <ArrowRight size={17} />
        </Link>
        <Link className="text-link" to="/saved">
          <Bookmark size={16} />
          View saved places
        </Link>
      </section>
    </div>
  );
}
