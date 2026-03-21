import React from 'react';
import { 
  startOfMonth, endOfMonth, 
  startOfQuarter, endOfQuarter, 
  startOfYear, endOfYear,
  subMonths, subQuarters, subYears,
  format
} from 'date-fns';

const DateRangePicker = ({ value, onChange }) => {
  const presets = [
    { label: 'This Month', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
    { label: 'Last Month', getRange: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: 'This Quarter', getRange: () => ({ start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) }) },
    { label: 'Last Quarter', getRange: () => ({ start: startOfQuarter(subQuarters(new Date(), 1)), end: endOfQuarter(subQuarters(new Date(), 1)) }) },
    { label: 'This Year', getRange: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }) },
    { label: 'Last Year', getRange: () => ({ start: startOfYear(subYears(new Date(), 1)), end: endOfYear(subYears(new Date(), 1)) }) },
  ];

  const handlePresetClick = (getRange) => {
    onChange(getRange());
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {presets.map(preset => (
          <button 
            key={preset.label}
            className="btn btn-secondary btn-sm"
            onClick={() => handlePresetClick(preset.getRange)}
            style={{ fontSize: '0.85rem' }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>From:</label>
          <input 
            type="date" 
            className="input" 
            value={format(value.start, 'yyyy-MM-dd')}
            onChange={(e) => onChange({ ...value, start: new Date(e.target.value) })}
            style={{ padding: '4px 8px', width: 'auto' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>To:</label>
          <input 
            type="date" 
            className="input" 
            value={format(value.end, 'yyyy-MM-dd')}
            onChange={(e) => onChange({ ...value, end: new Date(e.target.value) })}
            style={{ padding: '4px 8px', width: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
