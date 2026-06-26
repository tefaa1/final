"use client";

import { useParams } from "next/navigation";
import CompetitionDetail from "@/src/components/competitions/CompetitionDetail";

// This route is fully client-driven and data-dependent (CompetitionDetail fetches
// the competition by id at runtime). It is a CLIENT component that reads the id
// via useParams() — exactly like matches/[id]/page.jsx. The previous async
// SERVER component (`await params`) made Next's dev prerender / static-paths
// worker crash the whole route ("Jest worker … child process exceptions" → 500)
// for EVERY role, so clicking a competition opened nothing. force-dynamic keeps
// Next from ever trying to statically pre-generate params for it.
export const dynamic = "force-dynamic";

export default function CompetitionDetailPage() {
  const { id } = useParams();
  return <CompetitionDetail compId={id} routed />;
}
