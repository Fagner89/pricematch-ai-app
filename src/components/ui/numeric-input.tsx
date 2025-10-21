import * as React from "react";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, 'type' | 'inputMode'> {
  decimalPlaces?: number;
  allowNegative?: boolean;
  onValueChange?: (value: string) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, decimalPlaces = 2, allowNegative = false, onValueChange, onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove caracteres não numéricos, exceto vírgula e sinal negativo (se permitido)
      if (allowNegative) {
        inputValue = inputValue.replace(/[^\d,-]/g, '');
      } else {
        inputValue = inputValue.replace(/[^\d,]/g, '');
      }
      
      // Permite apenas uma vírgula
      const commaCount = (inputValue.match(/,/g) || []).length;
      if (commaCount > 1) {
        const firstCommaIndex = inputValue.indexOf(',');
        inputValue = inputValue.substring(0, firstCommaIndex + 1) + inputValue.substring(firstCommaIndex + 1).replace(/,/g, '');
      }
      
      // Limita casas decimais
      const parts = inputValue.split(',');
      if (parts.length === 2 && parts[1].length > decimalPlaces) {
        parts[1] = parts[1].substring(0, decimalPlaces);
        inputValue = parts.join(',');
      }
      
      // Se tem sinal negativo, deve estar no início
      if (allowNegative && inputValue.includes('-')) {
        const withoutMinus = inputValue.replace(/-/g, '');
        if (inputValue.startsWith('-')) {
          inputValue = '-' + withoutMinus;
        } else {
          inputValue = withoutMinus;
        }
      }
      
      e.target.value = inputValue;
      
      if (onChange) {
        onChange(e);
      }
      
      if (onValueChange) {
        onValueChange(inputValue);
      }
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
