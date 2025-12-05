import { Badge } from '@/components/ui/badge';
import type { Priority } from '@/types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'default';
}

const priorityConfig = {
  high: {
    label: 'High',
    variant: 'destructive' as const,
  },
  medium: {
    label: 'Medium',
    variant: 'default' as const,
  },
  low: {
    label: 'Low',
    variant: 'secondary' as const,
  },
};

export default function PriorityBadge({ priority, size = 'default' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge
      variant={config.variant}
      className={size === 'sm' ? 'text-xs px-1.5 py-0' : ''}
    >
      {config.label}
    </Badge>
  );
}
