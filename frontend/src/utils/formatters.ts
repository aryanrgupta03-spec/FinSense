/**
 * FinSense Currency and Date Formatting Utilities
 * Specialized for Indian Rupee (INR ₹) and standard business dates
 */

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format to 2 decimal places
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian Numbering System formatting: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInteger}.${decimalPart}`;
}

export function formatCompactINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (absAmount >= 10000000) {
    formatted = `${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    formatted = `${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    formatted = `${(absAmount / 1000).toFixed(1)}k`;
  } else {
    formatted = absAmount.toFixed(0);
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0.0%';
  }
  return `${val.toFixed(1)}%`;
}
