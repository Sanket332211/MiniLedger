export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export interface DaysStatusInfo {
  status: 'repaid' | 'overdue' | 'due_today' | 'upcoming';
  label: string;
  days: number;
}

export function getDaysStatus(dueDateStr: string, isRepaid: boolean): DaysStatusInfo {
  if (isRepaid) {
    return {
      status: 'repaid',
      label: 'Repaid',
      days: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Due Today',
      days: 0,
    };
  }

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`,
      days: overdueDays,
    };
  }

  return {
    status: 'upcoming',
    label: `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`,
    days: diffDays,
  };
}
