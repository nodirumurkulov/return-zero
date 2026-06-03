import clsx from "clsx";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-green-100  text-green-700  border-green-200",
  B: "bg-blue-100   text-blue-700   border-blue-200",
  C: "bg-yellow-100 text-yellow-700 border-yellow-200",
  D: "bg-orange-100 text-orange-700 border-orange-200",
  F: "bg-red-100    text-red-700    border-red-200",
};

interface Props {
  grade: "A" | "B" | "C" | "D" | "F";
  size?: "sm" | "md" | "lg";
}

export default function Badge({ grade, size = "md" }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center font-bold border rounded",
        GRADE_STYLES[grade],
        size === "sm" && "w-6 h-6 text-xs",
        size === "md" && "w-7 h-7 text-sm",
        size === "lg" && "w-9 h-9 text-base"
      )}
    >
      {grade}
    </span>
  );
}

// Pill variant — for bias labels, stockout chips, etc.
const PILL_STYLES: Record<string, string> = {
  danger:  "bg-red-50    text-red-700    border-red-200",
  warning: "bg-orange-50 text-orange-700 border-orange-200",
  neutral: "bg-blue-50   text-blue-700   border-blue-200",
  success: "bg-green-50  text-green-700  border-green-200",
  muted:   "bg-gray-100  text-gray-500   border-gray-200",
};

export function Pill({
  label,
  variant = "muted",
}: {
  label: string;
  variant?: keyof typeof PILL_STYLES;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        PILL_STYLES[variant]
      )}
    >
      {label}
    </span>
  );
}
