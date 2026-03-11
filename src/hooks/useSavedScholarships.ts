import { useState, useEffect } from "react";

const STORAGE_KEY = "saved_scholarships";

export const useSavedScholarships = () => {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSavedIds(JSON.parse(stored));
  }, []);

  const updateStorage = (ids: string[]) => {
    setSavedIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const toggleSaved = (id: string) => {
    if (savedIds.includes(id)) {
      updateStorage(savedIds.filter((i) => i !== id));
    } else {
      updateStorage([...savedIds, id]);
    }
  };

  const clearSaved = () => updateStorage([]);

  const isSaved = (id: string) => savedIds.includes(id);

  return {
    savedIds,
    savedCount: savedIds.length,
    toggleSaved,
    clearSaved,
    isSaved,
  };
};
