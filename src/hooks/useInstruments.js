import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

export function useInstruments() {
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstruments() {
      const snapshot = await getDocs(collection(db, "instruments"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstruments(data);
      setLoading(false);
    }

    fetchInstruments();
  }, []);

  return { instruments, loading };
}