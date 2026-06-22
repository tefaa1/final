import CompetitionDetail from "@/src/components/competitions/CompetitionDetail";

export default async function CompetitionDetailPage({ params }) {
  const { id } = await params;
  return <CompetitionDetail compId={id} routed />;
}
