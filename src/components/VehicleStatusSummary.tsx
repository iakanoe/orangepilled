import {
  STATUS_STYLES,
  STATUS_ORDER,
  summarizeByStatus,
  type VehicleStat,
} from "@/lib/vehicle-status";

// Compact summary of vehicles grouped by status color.
export default function VehicleStatusSummary({
  stats,
}: {
  stats: VehicleStat[];
}) {
  const counts = summarizeByStatus(stats);
  return (
    <div className="grid grid-cols-3 gap-2">
      {STATUS_ORDER.map((status) => {
        const st = STATUS_STYLES[status];
        return (
          <div
            key={status}
            className={`flex flex-col items-center gap-1 rounded-xl border bg-white p-2 text-center ${st.ring}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
            <span className="text-lg font-bold leading-none">
              {counts[status]}
            </span>
            <span className="text-[10px] leading-tight text-gray-500">
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
