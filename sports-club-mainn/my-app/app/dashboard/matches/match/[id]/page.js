"use client";

import { useParams } from "next/navigation";
import { matchesData } from "@/src/data/matchesData";
import FormationBoard from "@/src/components/FormationBoard";

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = parseInt(params.id); 

  const match = matchesData.find((m) => m.id === matchId);

  if (!match) {
    return <div className="text-white p-6">Match not found</div>;
  }

  return <FormationBoard match={match} />;
}