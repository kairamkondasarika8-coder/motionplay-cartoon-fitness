import { useEffect, useState } from "react";
import { loadProfile, type Profile } from "./storage";
import { initVoices } from "./characters";

export function useProfile() {
  const [state, setState] = useState<{ ready: boolean; profile: Profile | null }>({ ready: false, profile: null });
  useEffect(() => { initVoices(); setState({ ready: true, profile: loadProfile() }); }, []);
  return state;
}
