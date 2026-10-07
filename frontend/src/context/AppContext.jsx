import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api, USE_MOCK_DATA } from "../services/api.js";

const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [userId, setUserId] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [toast, setToast] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    setData((previous) =>
      previous?.currentUserId === userId ? previous : null,
    );
    api
      .bootstrap(userId)
      .then((result) => {
        if (current !== generation.current) return;
        if (result.userId && result.userId !== userId) {
          setUserId(result.userId);
          return;
        }
        setData({ ...result, currentUserId: userId });
      })
      .catch((e) => {
        if (current === generation.current) setError(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [userId, revision]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function act(operation, message) {
    const result = await operation();
    setRevision((r) => r + 1);
    if (message) setToast(message);
    return result;
  }
  const value = {
    data,
    loading,
    error,
    userId,
    setUserId,
    revision,
    act,
    toast,
    setToast,
    isDemo: USE_MOCK_DATA,
    retry: () => setRevision((r) => r + 1),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
