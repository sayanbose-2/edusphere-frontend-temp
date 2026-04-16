import { useRef } from 'react';
import { BsCalendar3 } from 'react-icons/bs';

interface Props {
  value: string;
  onChange: (val: string) => void;
  max?: string;
  min?: string;
  required?: boolean;
  className?: string;
}

const today = new Date().toISOString().split('T')[0];

const DateInput = ({ value, onChange, max, min, required, className = '' }: Props) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className={`date-input-wrapper ${className}`} onClick={() => ref.current?.showPicker()}>
      <input
        ref={ref}
        type="date"
        className="date-input-native"
        value={value}
        max={max}
        min={min}
        required={required}
        onChange={e => onChange(e.target.value)}
      />
      <div className="date-input-display form-control">
        {value
          ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : <span className="text-tertiary">Pick a date</span>
        }
        <BsCalendar3 size={13} className="date-input-icon" />
      </div>
    </div>
  );
};

export { DateInput, today };
