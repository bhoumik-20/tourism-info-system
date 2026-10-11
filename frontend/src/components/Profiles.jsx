import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, ChevronDown, Plus, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fullName } from '../context/profileSelection';
import { api } from '../services/api';
import { Modal, ErrorMessage, EmptyState } from './UI';

export function Avatar({ user, large = false }) {
  const [failed, setFailed] = useState(false);
  return <span className={`avatar ${large ? 'profile-avatar' : ''}`}>
    {user?.profileImage && !failed ? <img src={user.profileImage} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : user?.firstName?.slice(0, 1).toUpperCase() || <UserRound size={large ? 30 : 18} />}
  </span>;
}
export function ProfilePrompt() {
  const { setProfileDialog } = useApp();
  return <EmptyState title="Make this journey yours" text="Select or create a traveler profile to save discoveries, write reviews and plan trips.">
    <button className="button primary" onClick={() => setProfileDialog('switch')}>Select a profile</button>
    <button className="button secondary" onClick={() => setProfileDialog('create')}>Create new user</button>
  </EmptyState>;
}
export function ProfileControl() {
  const { data, userId, setProfileDialog, loading } = useApp();
  const user = data?.users.find(item => item.userId === userId);
  return <details className="profile-control" key={userId || 'guest'}>
    <summary aria-label="Profile options"><Avatar user={user} /><span className="profile-control-name">{fullName(user) || (userId && loading ? 'Loading profile…' : 'Choose profile')}</span><ChevronDown size={15}/></summary>
    <div className="profile-menu">
      <strong>{fullName(user) || 'No profile selected'}</strong>
      <span className="muted">Classroom traveler profile</span>
      <Link to="/profile" onClick={event => event.currentTarget.closest('details').removeAttribute('open')}>View Profile</Link>
      <button onClick={event => { event.currentTarget.closest('details').removeAttribute('open'); setProfileDialog('switch'); }}>Switch User</button>
      <button onClick={event => { event.currentTarget.closest('details').removeAttribute('open'); setProfileDialog('create'); }}>Create New User</button>
    </div>
  </details>;
}
export function ProfileForm({ item, onClose }) {
  const { setUserId, retry, setToast } = useApp();
  const [form, setForm] = useState(Object.fromEntries(['firstName', 'middleName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'profileImage'].map(key => [key, item?.[key] || ''])));
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const field = name => ({ value: form[name], onChange: event => setForm({ ...form, [name]: event.target.value }) });
  async function submit(event) {
    event.preventDefault(); setError(''); setPending(true);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || null]));
      const user = item ? await api.updateProfile(item.userId, body) : await api.createProfile(body);
      if (!item) setUserId(user.userId); else retry();
      setToast(item ? 'Profile updated' : 'Your new profile is selected'); onClose();
    } catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <Modal title={item ? 'Edit your profile' : 'Create a traveler profile'} onClose={() => !pending && onClose()}>
    <form className="form-stack" onSubmit={submit}>
      <p className="muted">Your profile keeps your reviews, saved places and plans together. This is a local profile switcher.</p>
      <div className="form-row"><label>First name<input required maxLength={50} autoComplete="given-name" {...field('firstName')}/></label><label>Middle name<input maxLength={50} autoComplete="additional-name" {...field('middleName')}/></label></div>
      <label>Last name<input maxLength={50} autoComplete="family-name" {...field('lastName')}/></label>
      <label>Email<input required type="email" maxLength={150} autoComplete="email" {...field('email')}/></label>
      <div className="form-row"><label>Phone number<input type="tel" maxLength={20} autoComplete="tel" {...field('phoneNumber')}/></label><label>Date of birth<input type="date" autoComplete="bday" {...field('dateOfBirth')}/></label></div>
      <label>Profile image URL<input type="url" maxLength={500} placeholder="https://example.com/photo.jpg" {...field('profileImage')}/></label>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="modal-actions"><button type="button" className="button secondary" disabled={pending} onClick={onClose}>Cancel</button><button className="button primary" disabled={pending}>{pending ? 'Saving…' : item ? 'Save profile' : 'Create and select profile'}</button></div>
    </form>
  </Modal>;
}
export function ProfileDialogs() {
  const { data, userId, setUserId, profileDialog, setProfileDialog } = useApp();
  if (profileDialog === 'create') return <ProfileForm onClose={() => setProfileDialog('')}/>;
  if (profileDialog !== 'switch') return null;
  return <Modal title="Choose your traveler profile" onClose={() => setProfileDialog('')}>
    <p className="muted">Switch profiles to see that traveler's own saved discoveries and plans.</p>
    <div className="profile-list">{(data?.users || []).map(user => <button className={`profile-choice ${user.userId === userId ? 'is-selected' : ''}`} key={user.userId} onClick={() => { setUserId(user.userId); setProfileDialog(''); }}>
      <Avatar user={user}/><span>{fullName(user)}{user.userId === userId && <small>Currently selected</small>}</span><ArrowRight size={16}/>
    </button>)}</div>
    {!data?.users.length && <p className="muted">{data ? 'Create the first traveler profile.' : 'Profiles are loading. Please try again shortly.'}</p>}
    <div className="modal-actions"><button className="button primary" onClick={() => setProfileDialog('create')}><Plus size={16}/>Create New User</button></div>
  </Modal>;
}
