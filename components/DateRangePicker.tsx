import React, { useState } from 'react';
import { DateRange, DateRangePreset } from '../types/export';
import { getDateRangeFromPreset } from '../utils/export/reportGenerator';
import { ChevronDownIcon, CalendarIcon } from './icons';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  allowCustom?: boolean;
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
  { label: 'All Time', value: 'all_time' },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, allowCustom = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(value.preset === 'custom');

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsCustomMode(true);
      setIsOpen(false);
      // Don't update value immediately, let user pick dates
      onChange({ ...value, preset: 'custom' });
    } else {
      setIsCustomMode(false);
      const newRange = getDateRangeFromPreset(preset);
      onChange(newRange);
      setIsOpen(false);
    }
  };

  const handleCustomDateChange = (field: 'start' | 'end', dateStr: string) => {
    const date = new Date(dateStr);
    const newRange = { ...value, [field]: date, preset: 'custom' as DateRangePreset };
    onChange(newRange);
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={() => setIsOpen(!isOpen)}
             className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg hover:border-[rgb(var(--color-primary-rgb))] transition-colors"
           >
             <div className="flex items-center gap-2">
               <CalendarIcon className="h-4 w-4 text-[rgb(var(--color-text-muted-rgb))]" />
               <span style={{ color: value.preset === 'custom' ? 'rgb(var(--color-text-rgb))' : 'rgb(var(--color-primary-rgb))', fontWeight: 600 }}>
                 {value.preset && value.preset !== 'custom'
                   ? PRESETS.find(p => p.value === value.preset)?.label 
                   : 'Custom Range'}
               </span>
             </div>
             <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
           </button>
        </div>

        {isCustomMode && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={value.start.toISOString().split('T')[0]}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="px-3 py-1.5 text-sm border border-[rgb(var(--color-border-rgb))] rounded-md bg-[rgb(var(--color-card-rgb))]"
            />
            <span className="text-[rgb(var(--color-text-muted-rgb))]">-</span>
            <input
              type="date"
              value={value.end.toISOString().split('T')[0]}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="px-3 py-1.5 text-sm border border-[rgb(var(--color-border-rgb))] rounded-md bg-[rgb(var(--color-card-rgb))]"
            />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {PRESETS.map((preset) => (
              <li key={preset.value}>
                <button
                  type="button"
                  onClick={() => handlePresetChange(preset.value)}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors
                    ${value.preset === preset.value ? 'bg-[rgb(var(--color-primary-rgb))] text-white hover:bg-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-rgb))]'}`}
                >
                  {preset.label}
                </button>
              </li>
            ))}
            {allowCustom && (
              <li>
                <button
                  type="button"
                  onClick={() => handlePresetChange('custom')}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors
                    ${value.preset === 'custom' ? 'bg-[rgb(var(--color-primary-rgb))] text-white hover:bg-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-rgb))]'}`}
                >
                  Custom Range
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
