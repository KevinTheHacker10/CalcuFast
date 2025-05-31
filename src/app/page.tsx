
"use client";

import { useState, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eraser, Plus, Minus, X, Divide, Percent, Equal, Baseline } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_DISPLAY_LENGTH = 16; // Max characters for display

interface CalculatorButtonProps extends React.ComponentProps<typeof Button> {
  label: ReactNode;
  value?: string;
  gridSpan?: number;
  onClickAction: () => void;
  buttonType?: 'number' | 'operator' | 'action' | 'equals';
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  label,
  gridSpan,
  className,
  onClickAction,
  buttonType = 'number',
  ...props
}) => {
  const baseStyle = "text-2xl md:text-3xl h-16 md:h-20 rounded-lg shadow-md hover:shadow-lg active:shadow-sm transition-all duration-150 ease-in-out focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2";
  
  let variantStyle = "";
  switch (buttonType) {
    case 'number':
      variantStyle = "bg-secondary/50 hover:bg-secondary/70 text-secondary-foreground";
      break;
    case 'operator':
      variantStyle = "bg-primary/80 hover:bg-primary text-primary-foreground";
      break;
    case 'action':
      variantStyle = "bg-accent/80 hover:bg-accent text-accent-foreground";
      break;
    case 'equals':
      variantStyle = "bg-primary hover:bg-primary/90 text-primary-foreground";
      break;
    default:
      variantStyle = "bg-secondary/50 hover:bg-secondary/70 text-secondary-foreground";
  }
  
  return (
    <Button
      className={cn(
        baseStyle,
        gridSpan ? `col-span-${gridSpan}` : "",
        variantStyle,
        className
      )}
      onClick={onClickAction}
      {...props}
    >
      {label}
    </Button>
  );
};


export default function CalculatorPage() {
  const [currentValue, setCurrentValue] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [expression, setExpression] = useState<string>("");
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const { toast } = useToast();

  const formatOutput = (numStr: string): string => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return "Error";
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER || String(num).length > MAX_DISPLAY_LENGTH) {
        return num.toExponential(6);
    }
    // Limit precision and remove trailing zeros
    let formatted = parseFloat(num.toPrecision(12)).toString();
    if (formatted.length > MAX_DISPLAY_LENGTH && formatted.includes('e')) { // already scientific
        return formatted;
    }
    if (formatted.length > MAX_DISPLAY_LENGTH && formatted.includes('.')) {
        const [integerPart, decimalPart] = formatted.split('.');
        const availableDecimalPlaces = MAX_DISPLAY_LENGTH - integerPart.length -1;
        if (availableDecimalPlaces < 0) return parseFloat(num.toPrecision(MAX_DISPLAY_LENGTH - 5)).toExponential(6); // Fallback for very large integers
        formatted = `${integerPart}.${decimalPart.substring(0, Math.max(0, availableDecimalPlaces))}`;
        formatted = parseFloat(formatted).toString(); // remove trailing zeros from new cut
    } else if (formatted.length > MAX_DISPLAY_LENGTH) {
        return num.toExponential(6);
    }
    return formatted;
  };


  const handleNumberClick = (number: string) => {
    if (currentValue.length >= MAX_DISPLAY_LENGTH && !overwrite) return;
    if (overwrite) {
      setCurrentValue(number);
      setOverwrite(false);
    } else {
      setCurrentValue(currentValue === "0" ? number : currentValue + number);
    }
  };

  const handleDecimalClick = () => {
    if (overwrite) {
      setCurrentValue("0.");
      setOverwrite(false);
    } else if (!currentValue.includes(".")) {
      if (currentValue.length >= MAX_DISPLAY_LENGTH -1) return;
      setCurrentValue(currentValue + ".");
    }
  };

  const handleOperatorClick = (op: string) => {
    if (currentValue === "Error") return;
    if (previousValue !== null && operator !== null && !overwrite) {
      calculate(); 
      // After calculate, currentValue is the result, previousValue and operator are cleared.
      // We need to set them up for the new operation.
      setPreviousValue(currentValue); // This will be the result of previous calculation
      setOperator(op);
      setExpression(`${formatOutput(currentValue)} ${op}`);
      setOverwrite(true);
      return;
    }

    setPreviousValue(currentValue);
    setOperator(op);
    setExpression(`${formatOutput(currentValue)} ${op}`);
    setOverwrite(true);
  };
  
  const calculate = () => {
    if (operator === null || previousValue === null || currentValue === "Error") {
      return;
    }

    let prev = parseFloat(previousValue);
    let current = parseFloat(currentValue);

    if (isNaN(prev) || isNaN(current)) {
        toast({ title: "Invalid input", description: "Please ensure numbers are valid.", variant: "destructive" });
        clearAll();
        return;
    }

    let resultValue: number;
    switch (operator) {
      case "+":
        resultValue = prev + current;
        break;
      case "-":
        resultValue = prev - current;
        break;
      case "*":
        resultValue = prev * current;
        break;
      case "/":
        if (current === 0) {
          setCurrentValue("Error");
          setExpression("Cannot divide by zero");
          setPreviousValue(null);
          setOperator(null);
          setOverwrite(true);
          return;
        }
        resultValue = prev / current;
        break;
      default:
        return;
    }
    
    const formattedResult = formatOutput(String(resultValue));
    setExpression(`${formatOutput(previousValue)} ${operator} ${formatOutput(currentValue)} =`);
    setCurrentValue(formattedResult);
    setPreviousValue(null); 
    setOperator(null);
    setOverwrite(true);
  };

  const handleEqualsClick = () => {
    if (currentValue === "Error") return;
    calculate();
  };

  const clearAll = () => {
    setCurrentValue("0");
    setPreviousValue(null);
    setOperator(null);
    setExpression("");
    setOverwrite(true);
  };

  const handleToggleSign = () => {
    if (currentValue === "Error" || currentValue === "0") return;
    setCurrentValue(formatOutput(String(parseFloat(currentValue) * -1)));
  };

  const handlePercent = () => {
    if (currentValue === "Error") return;
    setCurrentValue(formatOutput(String(parseFloat(currentValue) / 100)));
    setOverwrite(true); // Typically, after %, you start a new number or operation
  };
  
  const buttons = [
    { label: "AC", onClickAction: clearAll, gridSpan: 1, buttonType: 'action' as const, value: "clear" },
    { label: <Baseline size={28} />, onClickAction: handleToggleSign, gridSpan: 1, buttonType: 'action' as const, value: "togglesign" },
    { label: <Percent size={28} />, onClickAction: handlePercent, gridSpan: 1, buttonType: 'action' as const, value: "percent" },
    { label: <Divide size={28} />, onClickAction: () => handleOperatorClick("/"), gridSpan: 1, buttonType: 'operator' as const, value: "/" },
    
    { label: "7", onClickAction: () => handleNumberClick("7"), value: "7" },
    { label: "8", onClickAction: () => handleNumberClick("8"), value: "8" },
    { label: "9", onClickAction: () => handleNumberClick("9"), value: "9" },
    { label: <X size={28} />, onClickAction: () => handleOperatorClick("*"), buttonType: 'operator' as const, value: "*" },

    { label: "4", onClickAction: () => handleNumberClick("4"), value: "4" },
    { label: "5", onClickAction: () => handleNumberClick("5"), value: "5" },
    { label: "6", onClickAction: () => handleNumberClick("6"), value: "6" },
    { label: <Minus size={28} />, onClickAction: () => handleOperatorClick("-"), buttonType: 'operator' as const, value: "-" },

    { label: "1", onClickAction: () => handleNumberClick("1"), value: "1" },
    { label: "2", onClickAction: () => handleNumberClick("2"), value: "2" },
    { label: "3", onClickAction: () => handleNumberClick("3"), value: "3" },
    { label: <Plus size={28} />, onClickAction: () => handleOperatorClick("+"), buttonType: 'operator' as const, value: "+" },

    { label: "0", onClickAction: () => handleNumberClick("0"), gridSpan: 2, value: "0" },
    { label: ".", onClickAction: handleDecimalClick, value: "." },
    { label: <Equal size={28} />, onClickAction: handleEqualsClick, buttonType: 'equals' as const, value: "=" },
  ];


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-xs md:max-w-sm shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-center text-3xl font-headline text-primary">Calcufast</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="bg-input text-right p-3 md:p-4 rounded-lg mb-4 shadow-inner min-h-[100px] md:min-h-[120px] flex flex-col justify-end">
            <div 
              className="text-muted-foreground text-sm md:text-base h-6 md:h-7 truncate opacity-75" 
              title={expression}
            >
              {expression}
            </div>
            <div 
              className="text-foreground text-3xl md:text-5xl font-bold h-10 md:h-14 truncate"
              title={currentValue}
            >
              {currentValue}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {buttons.map((btn) => (
              <CalculatorButton
                key={typeof btn.label === 'string' ? btn.label : btn.value}
                label={btn.label}
                onClickAction={btn.onClickAction}
                gridSpan={btn.gridSpan}
                buttonType={btn.buttonType || 'number'}
                aria-label={typeof btn.label === 'string' ? btn.label : `Button ${btn.value}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Calcufast. Built with Next.js & Tailwind CSS.</p>
      </footer>
    </div>
  );
}

