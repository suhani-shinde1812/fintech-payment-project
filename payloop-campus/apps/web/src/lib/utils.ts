export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateString);
}

export function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-gray-500',
    2: 'text-blue-500',
    3: 'text-purple-500',
    4: 'text-orange-500',
    5: 'text-yellow-500',
  };
  return colors[level] || 'text-gray-500';
}

export function getLevelBg(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-purple-100 text-purple-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-yellow-100 text-yellow-700',
  };
  return colors[level] || 'bg-gray-100 text-gray-600';
}

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F97316',
  Travel: '#3B82F6',
  Shopping: '#EC4899',
  Education: '#8B5CF6',
  Entertainment: '#06B6D4',
  Bills: '#EF4444',
  Other: '#6B7280',
  Services: '#14B8A6',
  Fitness: '#22C55E',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍽️',
  Travel: '🚌',
  Shopping: '🛍️',
  Education: '📚',
  Entertainment: '🎬',
  Bills: '📑',
  Other: '📦',
  Services: '🔧',
  Fitness: '🏋️',
};
