import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import {
  CONTROL_BASE_CLASSES,
  CONTROL_ICON_LEFT_PADDING,
  CONTROL_ICON_RIGHT_PADDING,
  CONTROL_SIZE_CLASSES,
  CONTROL_STATE_CLASSES,
} from "./controlStyles";

export interface AppAutocompleteOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  helperText?: string;
}

interface AppAutocompleteSelectProps {
  value: string;
  options: AppAutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  uiSize?: "sm" | "md";
  className?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

export default function AppAutocompleteSelect({
  value,
  options,
  onChange,
  placeholder = "Search and select…",
  emptyMessage = "No records found.",
  loading = false,
  disabled = false,
  uiSize = "md",
  className = "",
}: AppAutocompleteSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.label ?? "");
    }
  }, [open, selectedOption]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      [option.label, option.description, option.keywords, option.helperText]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    );
  }, [options, query]);

  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [query, filteredOptions.length]);

  const highlightedOption =
    highlightedIndex >= 0 ? filteredOptions[highlightedIndex] ?? null : null;

  const selectOption = (option: AppAutocompleteOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const iconSize = uiSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div ref={wrapperRef} className="relative">
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-stone-400 ${iconSize}`}
      />
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={highlightedOption ? `${listboxId}-${highlightedOption.value}` : undefined}
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        className={[
          CONTROL_BASE_CLASSES,
          CONTROL_SIZE_CLASSES[uiSize],
          CONTROL_STATE_CLASSES.default,
          CONTROL_ICON_LEFT_PADDING[uiSize],
          CONTROL_ICON_RIGHT_PADDING[uiSize],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            setHighlightedIndex((current) =>
              filteredOptions.length === 0 ? -1 : (current + 1 + filteredOptions.length) % filteredOptions.length,
            );
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            setHighlightedIndex((current) =>
              filteredOptions.length === 0 ? -1 : (current - 1 + filteredOptions.length) % filteredOptions.length,
            );
            return;
          }
          if (event.key === "Enter") {
            if (open && highlightedOption) {
              event.preventDefault();
              selectOption(highlightedOption);
            }
            return;
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            setQuery(selectedOption?.label ?? "");
          }
        }}
      />
      <div className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-stone-400">
        {loading ? <LoaderCircle className={`${iconSize} animate-spin`} /> : <ChevronDown className={iconSize} />}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-2xl border border-[var(--erp-border)] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-[var(--erp-text-muted)]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading employee records...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[var(--erp-text-muted)]">{emptyMessage}</div>
          ) : (
            <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-2">
              {filteredOptions.map((option, index) => {
                const active = index === highlightedIndex;
                const selected = option.value === value;
                return (
                  <li key={option.value} id={`${listboxId}-${option.value}`} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={[
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition cursor-pointer",
                        active ? "bg-[linear-gradient(180deg,#fffdf6_0%,#f8fafc_100%)]" : "bg-white hover:bg-stone-50",
                      ].join(" ")}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectOption(option);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(231,184,47,0.2)] bg-[rgba(231,184,47,0.08)] text-[var(--erp-brand)]">
                        {selected ? <Check className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--erp-text)]">{option.label}</p>
                        {option.description ? (
                          <p className="mt-1 truncate text-xs text-[var(--erp-text-muted)]">{option.description}</p>
                        ) : null}
                        {option.helperText ? (
                          <p className="mt-1 text-[11px] text-[var(--erp-text-muted)]">{option.helperText}</p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
