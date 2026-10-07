import { useEffect, useState } from "react";
export function useAsync(load, dependencies) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: "" });
    load()
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({ data: null, loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, dependencies);
  return state;
}
