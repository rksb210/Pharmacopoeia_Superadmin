import React from 'react';
import { BookOpen, Camera, GraduationCap, Bookmark } from 'lucide-react';

export const QuickActionCards = ({ onCardClick }) => {
  const cards = [
    {
      id: 'library',
      title: 'NFI Library',
      subtitle: 'Browse Monographs',
      icon: BookOpen,
      iconColor: 'text-sky-500',
    },
    {
      id: 'kaym',
      title: 'KAYM',
      subtitle: 'Identify a Medicine',
      icon: Camera,
      iconColor: 'text-teal-600',
    },
    {
      id: 'diksha',
      title: 'DIKSHA',
      subtitle: 'Courses & Certificates',
      icon: GraduationCap,
      iconColor: 'text-slate-800',
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      subtitle: '12 saved',
      icon: Bookmark,
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onCardClick && onCardClick(card.id)}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 text-left hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col justify-between h-32 group cursor-pointer"
          >
            {/* Top Icon */}
            <div>
              <Icon className={`w-6 h-6 ${card.iconColor} transition-transform group-hover:scale-110`} />
            </div>

            {/* Bottom Title & Subtitle */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {card.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionCards;
