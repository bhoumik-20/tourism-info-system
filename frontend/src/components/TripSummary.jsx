import { Route, MapPin, Layers, Landmark, Utensils, Bike, CalendarDays, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { Loading, ErrorMessage } from './UI';
export default function TripSummary({ tripNo }) {
  const { userId, revision, isDemo } = useApp();
  const result=useAsync(()=>userId ? api.getTripSummary(userId,tripNo) : Promise.resolve(null),[userId,tripNo,revision]);
  if(result.loading)return <Loading/>;
  if(result.error)return <ErrorMessage>{result.error}</ErrorMessage>;
  if(!result.data)return null;
  const s=result.data;
  const metrics=[[Route,'Itineraries',s.itineraryCount],[MapPin,'Unique POIs',s.uniquePoiCount],[Layers,'Total memberships',s.membershipCount],[Landmark,'Places',s.placeCount],[Utensils,'Restaurants',s.restaurantCount],[Bike,'Activities',s.activityCount],[CalendarDays,'Events',s.eventCount],[Star,'Mean POI rating',s.averageRating===null?'Unrated':Number(s.averageRating).toFixed(2)]];
  return <section aria-labelledby="trip-summary-title"><div className="section-heading"><div><p className="eyebrow">YOUR JOURNEY AT A GLANCE</p><h2 id="trip-summary-title">A little overview.</h2><p>Every discovery counts. Repeated stops count once in unique POIs.</p></div></div><div className="summary-grid">{metrics.map(([Icon,label,value])=><article className="summary-card" key={label}><Icon size={20}/><strong>{value}</strong><span>{label}</span></article>)}</div><p className="muted summary-note">{isDemo?'Offline demo statistics.':'Live trip statistics.'} Mean rating gives each of the {s.reviewedPoiCount} reviewed unique POIs equal weight; unrated POIs are excluded.</p></section>;
}
