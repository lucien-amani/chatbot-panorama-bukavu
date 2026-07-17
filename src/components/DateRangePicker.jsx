import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

function toLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatFR(dateStr) {
  if (!dateStr) return '';
  const d = toLocal(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inRange(d, s, e) {
  if (!s || !e) return false;
  return d > s && d < e;
}

function MonthGrid({ year, month, startStr, endStr, hovered, selecting, minDate, onDayClick, onDayHover }) {
  const startObj = toLocal(startStr);
  const endObj = toLocal(endStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const minObj = minDate ? toLocal(minDate) : today;

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);

  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(year, month, d);
    const disabled = cur < minObj;
    const isStart = sameDay(cur, startObj);
    const isEnd = sameDay(cur, endObj);
    const isToday = sameDay(cur, today);
    const effectiveEnd = endObj || (selecting === 'end' && hovered ? hovered : null);
    const inR = !isStart && !isEnd && inRange(cur, startObj, effectiveEnd);

    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onDayClick(cur)}
        onMouseEnter={() => !disabled && onDayHover(cur)}
        className={[
          'relative flex items-center justify-center w-9 h-9 text-sm font-medium transition-all select-none',
          disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer',
          isStart || isEnd
            ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] rounded-full hover:bg-[var(--accent-hover)] z-10'
            : inR
            ? 'bg-[var(--accent-color)]/15 text-[var(--text-main)] rounded-none'
            : !disabled ? 'hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-main)]' : 'text-[var(--text-muted)]',
          isToday && !isStart && !isEnd ? 'ring-1 ring-[var(--accent-color)] ring-inset rounded-full' : '',
          inR && sameDay(startObj, toLocal(toStr(new Date(year, month, d-1)))) ? '' : '',
        ].filter(Boolean).join(' ')}
      >
        {d}
      </button>
    );
  }

  return (
    <div>
      <div className="text-center font-bold text-[var(--text-main)] text-sm mb-3">
        {MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[var(--text-muted)] uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">{cells}</div>
    </div>
  );
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, minDate, compact = false }) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState('start');
  const [hovered, setHovered] = useState(null);
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDayClick = (date) => {
    const str = toStr(date);
    if (selecting === 'start') {
      onStartChange(str);
      if (endDate && date >= toLocal(endDate)) onEndChange('');
      setSelecting('end');
    } else {
      const startObj = toLocal(startDate);
      if (startDate && date <= startObj) {
        onStartChange(str);
        onEndChange('');
      } else {
        onEndChange(str);
        setOpen(false);
        setSelecting('start');
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const next2Month = viewMonth === 11 ? 0 : viewMonth + 1;
  const next2Year = viewMonth === 11 ? viewYear + 1 : viewYear;

  const reset = () => { onStartChange(''); onEndChange(''); setSelecting('start'); };

  const label = startDate
    ? `${formatFR(startDate)}${endDate ? ` → ${formatFR(endDate)}` : ' → Départ ?'}`
    : 'Arrivée → Départ';

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSelecting(startDate && !endDate ? 'end' : 'start'); }}
        className={[
          'flex items-center gap-2.5 w-full rounded-xl border transition-all shadow-sm select-none text-sm font-semibold cursor-pointer',
          compact
            ? 'px-3 py-2 bg-transparent border-transparent hover:border-[var(--border-color)]'
            : 'px-4 py-3 bg-[var(--surface-app)] border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-main)]',
          open ? 'border-[var(--accent-color)]' : '',
        ].join(' ')}
      >
        <Calendar size={16} className="text-[var(--accent-color)] shrink-0" />
        <span className={`text-left truncate ${startDate ? 'text-[var(--text-main)] font-semibold text-sm' : 'text-[var(--text-muted)] text-sm'}`}>
          {label}
        </span>
        {(startDate || endDate) && (
          <button type="button" onClick={e => { e.stopPropagation(); reset(); }}
            className="ml-auto p-0.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors shrink-0">
            <X size={12} />
          </button>
        )}
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-4 w-max max-w-[95vw]">
          {/* Hint */}
          <p className="text-center text-xs text-[var(--accent-color)] font-semibold mb-3">
            {selecting === 'start' ? '📅 Choisissez la date d\'arrivée' : '📅 Choisissez la date de départ'}
          </p>

          {/* Nav + Months */}
          <div className="flex items-start gap-6">
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors self-start mt-1">
              <ChevronLeft size={16} />
            </button>

            <div className="flex gap-8">
              <MonthGrid year={viewYear} month={viewMonth}
                startStr={startDate} endStr={endDate}
                hovered={hovered} selecting={selecting} minDate={minDate}
                onDayClick={handleDayClick}
                onDayHover={setHovered} />

              {/* Second month - hidden on small screens */}
              <div className="hidden md:block">
                <MonthGrid year={next2Year} month={next2Month}
                  startStr={startDate} endStr={endDate}
                  hovered={hovered} selecting={selecting} minDate={minDate}
                  onDayClick={handleDayClick}
                  onDayHover={setHovered} />
              </div>
            </div>

            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors self-start mt-1">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={reset}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-medium">
              Réinitialiser
            </button>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              {startDate && <span className="font-semibold text-[var(--text-main)]">{formatFR(startDate)}</span>}
              {startDate && endDate && <span>→</span>}
              {endDate && <span className="font-semibold text-[var(--text-main)]">{formatFR(endDate)}</span>}
            </div>
            {startDate && endDate && (
              <button type="button" onClick={() => setOpen(false)}
                className="bg-[var(--accent-color)] text-[var(--text-on-accent)] text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
                Confirmer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
