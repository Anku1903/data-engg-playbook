import * as Icons from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

type LucideIcon = typeof Icons.Database;

function getIcon(name?: string): LucideIcon {
  if (!name) return Icons.Inbox;
  const mod = Icons as unknown as Record<string, LucideIcon | undefined>;
  return mod[name] ?? Icons.Inbox;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  const Icon = getIcon(icon);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="w-10 h-10 text-vsc-textDim" />
      <div className="text-h3 text-vsc-heading">{title}</div>
      <div className="text-body2 text-vsc-textMuted max-w-md">{description}</div>
    </div>
  );
}
