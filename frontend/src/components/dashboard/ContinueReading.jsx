import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';

export const ContinueReading = () => {
  const readings = [
    {
      id: 1,
      title: 'Paracetamol',
      section: 'Dose & Interactions section · 8 min read',
    },
    {
      id: 2,
      title: 'Amoxicillin',
      section: 'Contraindications section · 5 min read',
    },
    {
      id: 3,
      title: 'Metformin Hydrochloride',
      section: 'Adverse effects section · 6 min read',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 select-none shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          Continue Reading
        </h3>
        <a
          href="#history"
          onClick={(e) => e.preventDefault()}
          className="text-xs sm:text-sm font-semibold text-[#E76120] hover:underline flex items-center gap-1"
        >
          <span>View History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* List */}
      <div className="space-y-4">
        {readings.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {item.section}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="text-xs sm:text-sm font-semibold text-[#E76120] hover:underline shrink-0 cursor-pointer"
            >
              Resume
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueReading;
