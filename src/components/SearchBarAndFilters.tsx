import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Category } from '../types/portal';

interface SearchBarAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string; // 'all' or category id
  onSelectCategory: (categoryId: string) => void;
  categories: Category[];
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  categoryCounts,
  totalCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative max-w-3xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-4.5 w-5 h-5 text-[#4B5277] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อแอปพลิเคชัน, แผนก, งานบริบาล, คลังยา หรือคีย์เวิร์ด..."
            className="w-full pl-12 pr-20 py-3.5 sm:py-4 rounded-2xl bg-white/85 hover:bg-white focus:bg-white border border-[#1E223D]/15 focus:border-[#F54F1B] focus:ring-4 focus:ring-[#F54F1B]/15 text-[#1E223D] placeholder-[#6E7395] text-sm sm:text-base outline-none transition-all shadow-md shadow-[#1E223D]/5 backdrop-blur-md"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-1.5 rounded-full text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
              title="ล้างข้อความค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 absolute right-4 px-2 py-1 rounded-lg bg-[#1E223D]/5 border border-[#1E223D]/10 text-[11px] font-mono text-[#4B5277] pointer-events-none">
              <span>⌘</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Segmented Filter Tabs */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 pt-1 no-scrollbar gap-2 px-1">
        {/* All Tab */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#F54F1B] text-white shadow-md shadow-[#F54F1B]/25 font-semibold'
              : 'bg-white/80 hover:bg-white text-[#1E223D] border border-[#1E223D]/10 shadow-xs'
          }`}
        >
          <span>ทั้งหมด</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-[#1E223D]/10 text-[#1E223D]'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'bg-[#F54F1B] text-white shadow-md shadow-[#F54F1B]/25 font-semibold'
                  : 'bg-white/80 hover:bg-white text-[#1E223D] border border-[#1E223D]/10 shadow-xs'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1E223D]/10 text-[#1E223D]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
