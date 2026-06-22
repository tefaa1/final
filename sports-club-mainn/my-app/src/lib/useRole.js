"use client";
import { useState, useEffect } from "react";
import { isReadOnly } from "./permissions";

// Reads the user role from localStorage once on mount and returns
// { role, readOnly, canEdit }. Used in client components to gate
// add/edit/delete UI for read-only roles like "fan".
export default function useRole() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user_role");
    setRole(saved ? saved.toLowerCase() : "");
  }, []);

  const readOnly = isReadOnly(role);
  return { role, readOnly, canEdit: !readOnly };
}
