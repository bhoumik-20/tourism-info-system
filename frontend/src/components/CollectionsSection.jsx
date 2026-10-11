import { Link } from 'react-router-dom';
import { Star, Flame, Wallet, Utensils, CalendarDays, Sparkles, ArrowUpRight } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Loading, ErrorMessage } from './UI';
export const collectionIcons = { 'top-rated':Star, popular:Flame, budget:Wallet, foodie:Utensils, upcoming:CalendarDays, 'hidden-gems':Sparkles };
export default function CollectionsSection() {
  const { revision, isDemo } = useApp();
  const result = useAsync(() => isDemo ? Promise.resolve([]) : api.getCollections(), [revision,isDemo]);
  return <section className="section" aria-labelledby="collections-title">
    <div className="section-heading"><div><p className="eyebrow">A LITTLE INSPIRATION</p><h2 id="collections-title">Find your kind of discovery.</h2><p>Six collections, thoughtfully drawn from our city guide.</p></div><Link to="/collections" className="text-link">Browse collections <ArrowUpRight size={17}/></Link></div>
    {isDemo ? <p className="muted">Curated collections are available when connected to the live tourism database.</p> : result.loading ? <Loading/> : result.error ? <ErrorMessage>{result.error}</ErrorMessage> : <div className="collection-grid">{result.data.map(item => {
      const Icon = collectionIcons[item.slug];
      return <Link key={item.slug} className={`collection-card collection-${item.slug}`} to={`/collections/${item.slug}`}><span className="collection-icon"><Icon size={24}/></span><span className="collection-count">{item.poiCount} discoveries</span><h3>{item.title}</h3><p>{item.description}</p><span className="text-link">Explore collection <ArrowUpRight size={15}/></span></Link>;
    })}</div>}
  </section>;
}
