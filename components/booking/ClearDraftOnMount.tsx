"use client";

import { useEffect } from "react";
import { resetDraft } from "./draftStore";

/** Forgets the saved request (sessionStorage and memory) once the thank-you page has mounted. */
export function ClearDraftOnMount() {
  useEffect(() => {
    resetDraft();
  }, []);
  return null;
}
