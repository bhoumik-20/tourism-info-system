import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, USE_MOCK_DATA } from '../services/api.js';
import { readProfile, persistProfile } from './profileSelection.js';
const AppContext = createContext(null);
function storage() { try { return window.localStorage; } catch { return null; } }
export function AppProvider({ children }) {
  const [userId, selectId] = useState(() => readProfile(storage()));
  const activeId = useRef(userId);
  const [data, setData] = useState(null), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const [toast, setToast] = useState(''), [profileDialog, setProfileDialog] = useState('');
  const generation = useRef(0);
  function setUserId(id) {
    const next = id ? Number(id) : null;
    if (next === activeId.current) return;
    activeId.current = next;
    generation.current++;
    persistProfile(storage(), next);
    setData(null); // Clear the previous profile synchronously, before the next effect.
    setError(''); setLoading(true); setToast(''); setProfileDialog('');
    selectId(next);
  }
  useEffect(() => {
    const current = ++generation.current;
    setLoading(true); setError('');
    api.bootstrap(userId).then(result => {
      if (current !== generation.current) return;
      if (userId && !result.users.some(user => user.userId === userId)) { setUserId(null); return; }
      setData({ ...result, currentUserId: userId });
    }).catch(e => { if (current === generation.current) setError(e.message); })
      .finally(() => { if (current === generation.current) setLoading(false); });
    return () => { generation.current++; };
  }, [userId, revision]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const sync = event => { if (event.key === 'voyage-active-profile' || event.key === null) setUserId(readProfile(storage())); };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  function requireProfile() {
    if (activeId.current) return true;
    setProfileDialog('switch'); return false;
  }
  async function act(operation, message) {
    const owner = activeId.current;
    if (!owner) { setProfileDialog('switch'); throw new Error('Select or create a profile first.'); }
    const result = await operation();
    // A write keeps its original owner; never let a late response redirect the new profile.
    if (owner !== activeId.current) throw new Error('Profile changed. The earlier action belongs to the previously selected profile.');
    setRevision(r => r + 1); if (message) setToast(message); return result;
  }
  return <AppContext.Provider value={{ data, loading, error, userId, setUserId, revision, act,
    toast, setToast, profileDialog, setProfileDialog, requireProfile,
    isDemo: USE_MOCK_DATA, retry: () => setRevision(r => r + 1) }}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
