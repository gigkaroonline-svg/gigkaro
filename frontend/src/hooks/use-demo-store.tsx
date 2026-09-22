"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Application, PostedJob } from "@/types";
export type Profile = {
  name: string;
  mobile: string;
  email: string;
  pincode: string;
  city: string;
  radius: string;
  category: string;
  employmentType: string;
  shift: string;
  vehicle: string;
  licence: string;
  dob: string;
};
export type DemoState = {
  saved: string[];
  applications: Application[];
  postedJobs: PostedJob[];
  profile: Profile;
  statuses: Record<string, string>;
  notices: boolean;
  session: "candidate" | "employer" | null;
};
const initial: DemoState = {
  saved: [],
  applications: [],
  postedJobs: [],
  profile: {
    name: "",
    mobile: "",
    email: "",
    pincode: "560034",
    city: "Bengaluru",
    radius: "10",
    category: "delivery",
    employmentType: "Flexible",
    shift: "Flexible",
    vehicle: "No vehicle required",
    licence: "No",
    dob: "",
  },
  statuses: {},
  notices: false,
  session: null,
};
type Store = {
  state: DemoState;
  update: (fn: (state: DemoState) => DemoState) => void;
  ready: boolean;
  toast: (message: string) => void;
};
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gigkaro-demo-v1");
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("gigkaro-demo-v1", JSON.stringify(state));
      } catch {}
  }, [state, ready]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(id);
  }, [message]);
  return (
    <Context.Provider
      value={{ state, update: setState, ready, toast: setMessage }}
    >
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
export function useDemoStore() {
  const store = useContext(Context);
  if (!store) throw new Error("DemoProvider required");
  return store;
}
