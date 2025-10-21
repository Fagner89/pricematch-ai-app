import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Remove acentos de uma string para comparação
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Utility functions for Brazilian currency formatting
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
}

// Format number with Brazilian decimal separator
export function formatNumber(value: number | string, decimals: number = 3): string {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos
  const cents = parseInt(numbers);
  const reais = cents / 100;
  
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseCurrencyToDecimal(value: string): number {
  // Remove R$, espaços, pontos (milhares) e converte vírgula para ponto
  const cleanValue = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  return parseFloat(cleanValue) || 0;
}

export function handleCurrencyInput(
  value: string,
  onChange: (value: string) => void
): void {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) {
    onChange('');
    return;
  }
  
  // Limita a 10 dígitos (R$ 99.999.999,99)
  if (numbers.length > 10) return;
  
  // Converte para centavos e formata
  const cents = parseInt(numbers);
  const reais = cents / 100;
  
  const formatted = reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  onChange(formatted);
}

// Utility functions for percentage formatting (Brazilian format)
export function formatPercentageInput(value: string): string {
  // Remove tudo exceto números e vírgula
  let cleanValue = value.replace(/[^\d,]/g, '');
  
  // Limita a 2 casas decimais após a vírgula
  const parts = cleanValue.split(',');
  if (parts.length > 2) {
    cleanValue = `${parts[0]},${parts[1]}`;
  }
  if (parts[1] && parts[1].length > 2) {
    cleanValue = `${parts[0]},${parts[1].slice(0, 2)}`;
  }
  
  return cleanValue ? `${cleanValue}%` : '';
}

export function parsePercentageToDecimal(value: string): number {
  // Remove % e espaços, converte vírgula para ponto
  const cleanValue = value
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
}

export function handlePercentageInput(
  value: string,
  onChange: (value: string) => void
): void {
  // Remove o % se existir para trabalhar com o valor limpo
  const cleanInput = value.replace(/%/g, '');
  
  // Aplica a formatação
  const formatted = formatPercentageInput(cleanInput);
  
  onChange(formatted);
}

// Utility function to format percentage for display (always 2 decimal places)
export function formatPercentage(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Utility function to get count of stored items in localStorage
export function getStoredCount(key: string): number {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    
    const parsed = JSON.parse(stored);
    
    // If it's an array, return its length
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
    
    // If it's an object, return the number of keys
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed).length;
    }
    
    // If it's a string or other primitive, consider it as 1 item if not empty
    return parsed ? 1 : 0;
  } catch (error) {
    console.debug(`Error parsing localStorage key "${key}":`, error);
    return 0;
  }
}
