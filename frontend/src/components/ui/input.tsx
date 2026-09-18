import React, {
  useState,
  useRef,
  useEffect,
  useId,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- CustomDatePicker Component (Integrated into shared input.tsx) ---

export interface CustomDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  wrapperClassName?: string;
  type?: "date" | "datetime-local";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function parseDateString(valStr?: string): { date: Date | null; timeStr: string } {
  if (!valStr) return { date: null, timeStr: "12:00" };
  
  if (valStr.includes("T")) {
    const [dPart, tPart] = valStr.split("T");
    const parts = dPart.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return {
        date: new Date(parts[0], parts[1] - 1, parts[2]),
        timeStr: tPart ? tPart.substring(0, 5) : "12:00",
      };
    }
  } else {
    const parts = valStr.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return {
        date: new Date(parts[0], parts[1] - 1, parts[2]),
        timeStr: "12:00",
      };
    }
  }
  return { date: null, timeStr: "12:00" };
}

function formatDateString(date: Date, isDateTime = false, timeStr = "12:00"): string {
  const yyyy = date.getFullYear();
  const mm = formatZero(date.getMonth() + 1);
  const dd = formatZero(date.getDate());
  const datePart = `${yyyy}-${mm}-${dd}`;
  if (isDateTime) {
    return `${datePart}T${timeStr}`;
  }
  return datePart;
}

function formatDisplayString(valStr?: string, isDateTime = false): string {
  const { date, timeStr } = parseDateString(valStr);
  if (!date) return "";
  const monthName = MONTH_NAMES[date.getMonth()].substring(0, 3);
  const day = date.getDate();
  const year = date.getFullYear();
  if (isDateTime) {
    return `${monthName} ${day}, ${year} ${timeStr}`;
  }
  return `${monthName} ${day}, ${year}`;
}

export const CustomDatePicker = forwardRef<HTMLInputElement, CustomDatePickerProps>(
  (
    {
      className,
      wrapperClassName,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder,
      disabled,
      name,
      id,
      required,
      min,
      max,
      type = "date",
      style,
      ...restProps
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const isDateTime = type === "datetime-local";

    const nativeInputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => nativeInputRef.current as HTMLInputElement);

    const [currentValue, setCurrentValue] = useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return "";
    });

    const [isOpen, setIsOpen] = useState(false);
    
    const { date: selectedDateObj, timeStr: selectedTimeStr } = parseDateString(currentValue);
    const [timeVal, setTimeVal] = useState<string>(selectedTimeStr || "12:00");

    const today = new Date();
    const [viewYear, setViewYear] = useState<number>(
      selectedDateObj ? selectedDateObj.getFullYear() : today.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState<number>(
      selectedDateObj ? selectedDateObj.getMonth() : today.getMonth()
    );

    const [menuCoords, setMenuCoords] = useState<{
      top: number;
      left: number;
      width: number;
    }>({
      top: 0,
      left: 0,
      width: 280,
    });

    useEffect(() => {
      if (value !== undefined) {
        const valStr = String(value);
        setCurrentValue(valStr);
        const { date, timeStr } = parseDateString(valStr);
        if (date) {
          setViewYear(date.getFullYear());
          setViewMonth(date.getMonth());
          setTimeVal(timeStr);
        }
      }
    }, [value]);

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = isDateTime ? 360 : 310;
      const menuWidth = Math.max(rect.width, 280);

      const spaceBelow = viewportHeight - rect.bottom;
      const shouldFlip = spaceBelow < menuHeight && rect.top > menuHeight;

      if (shouldFlip) {
        setMenuCoords({
          top: rect.top + window.scrollY - menuHeight - 4,
          left: Math.min(rect.left + window.scrollX, window.innerWidth - menuWidth - 10),
          width: menuWidth,
        });
      } else {
        setMenuCoords({
          top: rect.bottom + window.scrollY + 4,
          left: Math.min(rect.left + window.scrollX, window.innerWidth - menuWidth - 10),
          width: menuWidth,
        });
      }
    };

    useEffect(() => {
      if (!isOpen) return;

      updatePosition();

      const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current?.contains(target) ||
          menuRef.current?.contains(target)
        ) {
          return;
        }
        setIsOpen(false);
      };

      const handleScrollOrResize = () => {
        updatePosition();
      };

      document.addEventListener("mousedown", handlePointerDownOutside, true);
      document.addEventListener("touchstart", handlePointerDownOutside, true);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        document.removeEventListener("mousedown", handlePointerDownOutside, true);
        document.removeEventListener("touchstart", handlePointerDownOutside, true);
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }, [isOpen]);

    const applyValue = (newValueStr: string) => {
      setCurrentValue(newValueStr);

      if (nativeInputRef.current) {
        nativeInputRef.current.value = newValueStr;

        const changeEvent = new Event("change", { bubbles: true });
        nativeInputRef.current.dispatchEvent(changeEvent);

        const inputEvent = new Event("input", { bubbles: true });
        nativeInputRef.current.dispatchEvent(inputEvent);
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || "",
            value: newValueStr,
            id: inputId,
          },
          currentTarget: {
            name: name || "",
            value: newValueStr,
            id: inputId,
          },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onValueChange) {
        onValueChange(newValueStr);
      }
    };

    const handleSelectDay = (day: number) => {
      const selected = new Date(viewYear, viewMonth, day);
      const valStr = formatDateString(selected, isDateTime, timeVal);
      applyValue(valStr);
      if (!isDateTime) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleTimeChange = (newTime: string) => {
      setTimeVal(newTime);
      const { date } = parseDateString(currentValue);
      if (date) {
        const valStr = formatDateString(date, true, newTime);
        applyValue(valStr);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      applyValue("");
      setIsOpen(false);
    };

    const handleSelectToday = () => {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      const timeStr = `${formatZero(now.getHours())}:${formatZero(now.getMinutes())}`;
      setTimeVal(timeStr);
      const valStr = formatDateString(now, isDateTime, timeStr);
      applyValue(valStr);
      setIsOpen(false);
    };

    const handlePrevMonth = () => {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    };

    const handleNextMonth = () => {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    };

    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const calendarCells: Array<{ day: number; isCurrentMonth: boolean; dateStr: string; disabled: boolean }> = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      calendarCells.push({
        day: pDay,
        isCurrentMonth: false,
        dateStr: `${viewMonth === 0 ? viewYear - 1 : viewYear}-${formatZero(viewMonth === 0 ? 12 : viewMonth)}-${formatZero(pDay)}`,
        disabled: true,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${formatZero(viewMonth + 1)}-${formatZero(d)}`;
      let isDisabled = false;
      if (min && dateStr < min) isDisabled = true;
      if (max && dateStr > max) isDisabled = true;

      calendarCells.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        disabled: isDisabled,
      });
    }

    const remainingCells = 42 - calendarCells.length;
    for (let n = 1; n <= remainingCells; n++) {
      calendarCells.push({
        day: n,
        isCurrentMonth: false,
        dateStr: `${viewMonth === 11 ? viewYear + 1 : viewYear}-${formatZero(viewMonth === 11 ? 1 : viewMonth + 2)}-${formatZero(n)}`,
        disabled: true,
      });
    }

    const displayVal = formatDisplayString(currentValue, isDateTime);

    const cleanClassName = className
      ? className
          .replace(/\b(rounded-[a-z0-9]+|border-[a-z0-9\/-]+|bg-(transparent|background|white|slate-[0-9]+|gray-[0-9]+|zinc-[0-9]+)|text-(foreground|slate-[0-9]+|white|black)|ring-offset-background)\b/g, "")
          .trim()
      : "";

    return (
      <div className={cn("relative inline-block w-full text-left", wrapperClassName)}>
        {/* Hidden native input for React Hook Form & HTML Form submit */}
        <input
          ref={nativeInputRef}
          id={inputId}
          name={name}
          type={type}
          value={currentValue}
          onChange={(e) => {
            setCurrentValue(e.target.value);
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className="sr-only absolute pointer-events-none opacity-0 h-0 w-0 -z-10"
          tabIndex={-1}
          aria-hidden="true"
          {...restProps}
        />

        {/* Custom trigger input button */}
        <button
          type="button"
          ref={triggerRef}
          disabled={disabled}
          style={style}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className={cn(
            "group flex h-10 w-full items-center justify-between rounded-xl border border-border bg-popover px-3.5 py-2 text-sm font-medium text-popover-foreground shadow-xs hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
            cleanClassName,
            isOpen && "border-accent ring-2 ring-accent/25"
          )}
        >
          <span
            className={cn(
              "truncate flex-1 text-left",
              !displayVal && "text-muted-foreground font-normal"
            )}
          >
            {displayVal || placeholder || (isDateTime ? "Select date & time..." : "Select date...")}
          </span>
          <div className="ml-2 flex items-center gap-1.5 shrink-0">
            {currentValue && !required && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Clear date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarIcon
              className={cn(
                "h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors",
                isOpen && "text-accent"
              )}
              aria-hidden="true"
            />
          </div>
        </button>

        {/* Floating Portal Calendar */}
        {isOpen &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "absolute",
                top: `${menuCoords.top}px`,
                left: `${menuCoords.left}px`,
                width: `${menuCoords.width}px`,
              }}
              className="z-[9999] rounded-xl border border-border bg-popover text-popover-foreground p-3.5 shadow-xl shadow-black/10 outline-none animate-in fade-in-0 zoom-in-95 duration-100 select-none"
            >
              {/* Header Navigation */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="font-semibold text-sm text-popover-foreground">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-[11px] font-semibold text-muted-foreground uppercase py-1">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={`cell-${idx}`}
                        className="py-1.5 text-xs text-muted-foreground/30 pointer-events-none"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const isSelected = selectedDateObj &&
                    selectedDateObj.getFullYear() === viewYear &&
                    selectedDateObj.getMonth() === viewMonth &&
                    selectedDateObj.getDate() === cell.day;

                  const isToday = today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === cell.day;

                  return (
                    <button
                      type="button"
                      key={`day-${cell.day}`}
                      disabled={cell.disabled}
                      onClick={() => handleSelectDay(cell.day)}
                      className={cn(
                        "h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                        cell.disabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
                        !cell.disabled && !isSelected && "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground font-bold shadow-xs",
                        isToday && !isSelected && "border border-accent text-accent font-bold"
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* DateTime Time Selector (if type=datetime-local) */}
              {isDateTime && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between px-1">
                  <label className="text-xs font-medium text-muted-foreground">Time:</label>
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between px-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="text-accent hover:underline focus:outline-none"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
);

CustomDatePicker.displayName = "CustomDatePicker";
export const DatePicker = CustomDatePicker;

// --- Input Component (Integrated into shared input.tsx) ---

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    if (type === "date" || type === "datetime-local") {
      return (
        <CustomDatePicker
          ref={ref}
          type={type}
          className={className}
          {...(props as any)}
        />
      );
    }
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
