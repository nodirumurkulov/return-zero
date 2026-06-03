import clsx from "clsx";

interface Props {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  alertColour?: "red" | "orange";
}

export default function StatCard({ label, value, sub, alert, alertColour = "red" }: Props) {
  return (
    <div
      className={clsx(
        "rounded-xl p-5 border transition-shadow",
        alert && alertColour === "red"    && "bg-red-50    border-red-100    border-l-4 border-l-grade-f",
        alert && alertColour === "orange" && "bg-orange-50 border-orange-100 border-l-4 border-l-grade-d",
        !alert                            && "bg-white border-gray-100"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-label text-gray-400 mb-2">
        {label}
      </p>
      <p
        className={clsx(
          "text-3xl font-black tracking-tighter leading-none",
          alert && alertColour === "red"    && "text-grade-f",
          alert && alertColour === "orange" && "text-grade-d",
          !alert                            && "text-pf-black"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}
