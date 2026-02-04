import { useNavigate } from "react-router-dom";
import type { JobGroup } from "../types";

export default function Card({ item }: { item: JobGroup }) {
  const navigate = useNavigate();

  return (
    <div
      className="relative cursor-pointer rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
      onClick={() => navigate(`/job-details/${item.jobGroupId}`)}
    >
      {/* Ribbon - left top */}
      {item.isRemoteAllowed === true && (
        <div className="absolute top-0 left-0 overflow-hidden h-20 w-20 pointer-events-none">
          <div className="absolute top-4 -left-8 -rotate-45 bg-emerald-600 text-white text-xs font-bold px-10 py-1 shadow-md">
            دورکاری
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-extrabold text-gray-900 leading-snug line-clamp-2">
        {item.title ?? "بدون عنوان"}
      </h3>

      {/* Meta */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">شهر</div>
          <div className="mt-1 font-semibold text-gray-900">
            {item.cityName ?? "—"}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">حداقل سابقه</div>
          <div className="mt-1 font-semibold text-gray-900">
            {item.minWorkExperience == null
              ? "—"
              : `${item.minWorkExperience} سال`}
          </div>
        </div>
      </div>
    </div>
  );
}
