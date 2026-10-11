import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import POICard from '../components/POICard';
import CollectionsSection from '../components/CollectionsSection';
import { EmptyState, Loading, ErrorMessage } from '../components/UI';
export default function Collections() {
  const { slug } = useParams();
  const { data, revision, isDemo } = useApp();
  const [params, setParams] = useSearchParams();
  const city = params.get('city') || '', type = params.get('type') || '';
  const result = useAsync(() => slug && !isDemo ? Promise.all([api.getCollections(),api.getCollection(slug,{city,type})]) : Promise.resolve(null),[slug,city,type,revision,isDemo]);
  if (!slug) return <div className="container collections-page"><CollectionsSection/></div>;
  const setFilter = (key,value) => { const next=new URLSearchParams(params); if(value)next.set(key,value);else next.delete(key);setParams(next); };
  const item = result.data?.[0]?.find(c => c.slug === slug);
  return <div className="container collections-page">
    <Link to="/collections" className="back-link"><ArrowLeft size={16}/>All collections</Link>
    <div className="page-heading"><p className="eyebrow">CURATED FOR YOUR CURIOSITY</p><h1>{item?.title || 'Curated discoveries'}</h1><p>{item?.description || 'A fresh way to explore the city.'}</p></div>
    <div className="collection-filters"><label>City<select value={city} onChange={e=>setFilter('city',e.target.value)}><option value="">All cities</option>{data.cities.map(c=><option value={c.cityId} key={c.cityId}>{c.cityName}</option>)}</select></label><label>POI type<select value={type} onChange={e=>setFilter('type',e.target.value)}><option value="">All types</option><option value="PLACE">Places</option><option value="RESTAURANT">Restaurants</option><option value="ACTIVITY">Activities</option><option value="EVENT">Events</option></select></label><button className="text-button" onClick={()=>setParams({})}>Clear filters</button></div>
    {isDemo ? <EmptyState title="Connect to your city guide" text="These collections use your installed Oracle views. Run Voyage in live mode to browse them."/> : result.error ? <ErrorMessage>{result.error}</ErrorMessage> : result.loading || !result.data ? <Loading/> : result.data[1].length ? <><p className="muted collection-results">{result.data[1].length} discoveries</p><div className="poi-grid home-grid">{result.data[1].map(p=><POICard key={`${p.poiId}:${p.type}`} poi={{...data.catalog.find(c=>c.poiId===p.poiId),...p}}/>)}</div></> : <EmptyState title="A quieter corner of the guide" text="No discoveries match these filters. Try another city or type."/>}
  </div>;
}
