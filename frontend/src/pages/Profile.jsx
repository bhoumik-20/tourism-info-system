import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Bookmark, MessageSquare, Route, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../context/profileSelection';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { Avatar, ProfilePrompt, ProfileForm } from '../components/Profiles';
import { Loading, ErrorMessage, dateLabel } from '../components/UI';
export default function Profile() {
  const { userId, revision } = useApp();
  const [edit, setEdit] = useState(false);
  const result = useAsync(() => userId ? api.getProfile(userId) : Promise.resolve(null), [userId, revision]);
  if (!userId) return <ProfilePrompt/>;
  if (result.loading) return <Loading/>;
  if (result.error) return <ErrorMessage>{result.error}</ErrorMessage>;
  const user = result.data;
  return <div className="container profile-page">
    <div className="page-heading heading-with-action"><div><p className="eyebrow">YOUR TRAVELER PROFILE</p><h1>A journey with your name on it.</h1><p>Your discoveries, stories and plans, together.</p></div><button className="button secondary" onClick={() => setEdit(true)}><Pencil size={16}/>Edit profile</button></div>
    <section className="profile-panel"><Avatar key={user.profileImage} user={user} large/><div><h2>{fullName(user)}</h2><dl className="profile-attributes"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Phone</dt><dd>{user.phoneNumber || 'Not provided'}</dd></div><div><dt>Date of birth</dt><dd>{user.dateOfBirth ? dateLabel(user.dateOfBirth) : 'Not provided'}</dd></div></dl></div></section>
    <section className="summary-grid" aria-label="Profile statistics">{[[MessageSquare,'Reviews',user.reviewCount,null],[Bookmark,'Saved POIs',user.savedPoiCount,'/saved'],[Route,'Trips',user.tripCount,'/trips'],[MapPin,'Itineraries',user.itineraryCount,'/trips']].map(([Icon,label,value,to]) => <article className="summary-card" key={label}><Icon size={20}/><strong>{value}</strong>{to ? <Link to={to}>{label}</Link> : <span>{label}</span>}</article>)}</section>
    {edit && <ProfileForm item={user} onClose={() => setEdit(false)}/>}
  </div>;
}
