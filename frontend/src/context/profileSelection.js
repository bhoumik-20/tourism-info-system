export const PROFILE_KEY = 'voyage-active-profile';
export function readProfile(storage) {
  try {
    const raw = storage?.getItem(PROFILE_KEY);
    const id = Number(raw);
    return /^[1-9]\d*$/.test(raw || '') && Number.isSafeInteger(id) && id <= 99999999 ? id : null;
  } catch { return null; }
}
export function persistProfile(storage, id) {
  try { if (id) storage?.setItem(PROFILE_KEY, String(id)); else storage?.removeItem(PROFILE_KEY); }
  catch { /* Session selection still works if browser storage is unavailable. */ }
}
export const fullName = (user) => [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ');
