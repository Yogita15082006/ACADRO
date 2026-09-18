import React, {
  useState,
  useRef,
  useEffect,
  useId,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// --- CustomSelect Component (Integrated into shared select.tsx) ---

export interface CustomSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options?: CustomSelectOption[];
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  wrapperClassName?: string;
}

function extractOptionsFromChildren(children: React.ReactNode): CustomSelectOption[] {
  const options: CustomSelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const props = child.props as Record<string, any> | undefined;
    if (!props) return;

    if (child.type === "option" || "value" in props) {
      const value = props.value !== undefined ? String(props.value) : "";
      const label = props.children !== undefined ? props.children : value;
      options.push({
        value,
        label,
        disabled: Boolean(props.disabled),
      });
    } else if (props.children) {
      options.push(...extractOptionsFromChildren(props.children));
    }
  });

  return options;
}

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      className,
      wrapperClassName,
      children,
      options: directOptions,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder,
      disabled,
      name,
      id,
      required,
      style,
      ...restProps
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    const nativeSelectRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => nativeSelectRef.current as HTMLSelectElement);

    const parsedOptions = directOptions || extractOptionsFromChildren(children);

    const [currentValue, setCurrentValue] = useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return "";
    });

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [menuCoords, setMenuCoords] = useState<{
      top: number;
      left: number;
      width: number;
      placement: "bottom" | "top";
    }>({
      top: 0,
      left: 0,
      width: 0,
      placement: "bottom",
    });

    useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(String(value));
      }
    }, [value]);

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedMenuHeight = Math.min(parsedOptions.length * 38 + 16, 240);

      const spaceBelow = viewportHeight - rect.bottom;
      const shouldFlip = spaceBelow < 40 && rect.top > estimatedMenuHeight;

      if (shouldFlip) {
        setMenuCoords({
          top: rect.top + window.scrollY - estimatedMenuHeight - 4,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 120),
          placement: "top",
        });
      } else {
        setMenuCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 120),
          placement: "bottom",
        });
      }
    };

    useEffect(() => {
      if (!isOpen) return;

      updatePosition();

      const selectedIdx = parsedOptions.findIndex((o) => o.value === currentValue);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);

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
    }, [isOpen, currentValue, parsedOptions]);

    useEffect(() => {
      if (!isOpen || highlightedIndex < 0 || !menuRef.current) return;
      const items = menuRef.current.querySelectorAll("[data-select-item]");
      const target = items[highlightedIndex] as HTMLElement | undefined;
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex, isOpen]);

    const handleSelectOption = (optValue: string) => {
      setCurrentValue(optValue);
      setIsOpen(false);

      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = optValue;

        const changeEvent = new Event("change", { bubbles: true });
        nativeSelectRef.current.dispatchEvent(changeEvent);

        const inputEvent = new Event("input", { bubbles: true });
        nativeSelectRef.current.dispatchEvent(inputEvent);
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || "",
            value: optValue,
            id: selectId,
          },
          currentTarget: {
            name: name || "",
            value: optValue,
            id: selectId,
          },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }

      if (onValueChange) {
        onValueChange(optValue);
      }

      triggerRef.current?.focus();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        setIsOpen(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < parsedOptions.length && parsedOptions[next]?.disabled) {
            next++;
          }
          return next < parsedOptions.length ? next : prev;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && parsedOptions[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const selected = parsedOptions[highlightedIndex];
        if (selected && !selected.disabled) {
          handleSelectOption(selected.value);
        }
      }
    };

    const selectedOption = parsedOptions.find((o) => o.value === currentValue);
    const displayLabel = selectedOption
      ? selectedOption.label
      : placeholder || (parsedOptions[0]?.label ?? "");

    const isPlaceholderShowing = !selectedOption && Boolean(placeholder);

    const cleanClassName = className
      ? className
          .replace(/\b(rounded-[a-z0-9]+|border-[a-z0-9\/-]+|bg-(transparent|background|white|slate-[0-9]+|gray-[0-9]+|zinc-[0-9]+)|text-(foreground|slate-[0-9]+|white|black)|ring-offset-background)\b/g, "")
          .trim()
      : "";

    return (
      <div className={cn("relative inline-block w-full text-left", wrapperClassName)}>
        {/* Hidden native select for HTML forms and React Hook Form */}
        <select
          ref={nativeSelectRef}
          id={selectId}
          name={name}
          value={currentValue}
          onChange={(e) => {
            setCurrentValue(e.target.value);
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          disabled={disabled}
          required={required}
          className="sr-only absolute pointer-events-none opacity-0 h-0 w-0 -z-10"
          tabIndex={-1}
          aria-hidden="true"
          {...restProps}
        >
          {children}
        </select>

        {/* Custom trigger button — uses semantic theme tokens */}
        <button
          type="button"
          ref={triggerRef}
          disabled={disabled}
          style={style}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
          className={cn(
            "group flex h-10 w-full items-center justify-between rounded-xl border border-border bg-popover px-3.5 py-2 text-sm font-medium text-popover-foreground shadow-xs hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
            cleanClassName,
            isOpen && "border-accent ring-2 ring-accent/25"
          )}
        >
          <span
            className={cn(
              "truncate flex-1 text-left",
              isPlaceholderShowing && "text-muted-foreground font-normal"
            )}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
              isOpen && "rotate-180 text-accent"
            )}
            aria-hidden="true"
          />
        </button>

        {/* Floating Portal Menu — uses semantic theme tokens */}
        {isOpen &&
          createPortal(
            <div
              ref={menuRef}
              role="listbox"
              tabIndex={-1}
              onKeyDown={handleMenuKeyDown}
              style={{
                position: "absolute",
                top: `${menuCoords.top}px`,
                left: `${menuCoords.left}px`,
                width: `${menuCoords.width}px`,
              }}
              className="z-[9999] max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 custom-scrollbar outline-none animate-in fade-in-0 zoom-in-95 duration-100"
            >
              {parsedOptions.length === 0 ? (
                <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                  No options available
                </div>
              ) : (
                parsedOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      data-select-item
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => {
                        if (!opt.disabled) {
                          handleSelectOption(opt.value);
                        }
                      }}
                      onMouseEnter={() => {
                        if (!opt.disabled) setHighlightedIndex(idx);
                      }}
                      className={cn(
                        "relative group flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors select-none",
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed text-muted-foreground"
                          : "text-popover-foreground",
                        isHighlighted &&
                          !opt.disabled &&
                          "bg-accent text-accent-foreground font-medium",
                        isSelected &&
                          !isHighlighted &&
                          "bg-accent/10 text-accent font-semibold"
                      )}
                    >
                      <span className="truncate flex-1">{opt.label}</span>
                      {isSelected && (
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0",
                            isHighlighted ? "text-accent-foreground" : "text-accent"
                          )}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";
export const SelectDropdown = CustomSelect;

// --- Radix UI Select Components ---

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex h-10 w-full items-center justify-between whitespace-nowrap rounded-xl border border-border bg-popover px-3.5 py-2 text-sm font-medium text-popover-foreground shadow-xs ring-offset-background placeholder:text-muted-foreground hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-150 data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/25",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground group-data-[state=open]:rotate-180 group-data-[state=open]:text-accent" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1 text-muted-foreground hover:text-foreground",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1 text-muted-foreground hover:text-foreground",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", side = "bottom", sideOffset = 4, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[9999] max-h-60 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 custom-scrollbar p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-0.5 space-y-0.5",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "group relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg py-2 px-3 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40 text-popover-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent/10 data-[state=checked]:text-accent",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="truncate flex-1">{children}</SelectPrimitive.ItemText>
    <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 group-data-[highlighted]:text-accent-foreground text-accent" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
