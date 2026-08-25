import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

export const BookmarksWidget = () => {
  const [bookmarks, setBookmarks] = useState([
    { id: 1, name: 'Paracetamol', type: 'Monograph' },
    { id: 2, name: 'Electrolyte Calculator', type: 'ADIT tool' },
    { id: 3, name: 'Vitamin D', type: 'Monograph' },
  ]);

  const removeBookmark = (id) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 select-none shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          My Bookmarks
        </h3>
        <a
          href="#bookmarks"
          onClick={(e) => e.preventDefault()}
          className="text-xs sm:text-sm font-semibold text-[#E76120] hover:underline flex items-center gap-1"
        >
          <span>View all (12)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Bookmarks List */}
      <div className="divide-y divide-slate-100">
        {bookmarks.map((item) => (
          <div
            key={item.id}
            className="py-3 flex items-center justify-between gap-4 group"
          >
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                {item.name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.type}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeBookmark(item.id)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Remove bookmark"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarksWidget;
