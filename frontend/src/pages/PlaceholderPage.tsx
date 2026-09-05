/**
 * Generic placeholder page — used for sections not yet implemented.
 * Shows a clean empty state with "Coming Soon" messaging.
 */

import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Construction className="w-8 h-8" />}
        title="Coming Soon"
        description={`The ${title} module is under development. This section will be implemented in a future phase.`}
      />
    </div>
  );
}
