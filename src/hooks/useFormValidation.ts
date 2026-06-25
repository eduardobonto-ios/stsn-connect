/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";

export type FieldValidator<T> = (value: T[keyof T], formValues: T) => string | undefined;
export type FieldValidators<T> = Partial<Record<keyof T, FieldValidator<T>>>;

export interface FieldState {
  error: string | undefined;
  touched: boolean;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type TouchedFields<T> = Partial<Record<keyof T, boolean>>;

export interface UseFormValidationReturn<T> {
  errors: FormErrors<T>;
  touched: TouchedFields<T>;
  /** Call on input blur to mark field touched and validate */
  handleBlur: (field: keyof T, value: T[keyof T], formValues: T) => void;
  /** Validate all fields at once; returns true if no errors */
  validateAll: (formValues: T) => boolean;
  /** Clear errors and touched state */
  reset: () => void;
  /** Check if a specific field has a visible error (touched + error) */
  fieldError: (field: keyof T) => string | undefined;
}

export function useFormValidation<T extends object>(
  validators: FieldValidators<T>,
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>({});

  const handleBlur = useCallback(
    (field: keyof T, value: T[keyof T], formValues: T) => {
      const validator = validators[field];
      const error = validator ? validator(value, formValues) : undefined;
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [validators],
  );

  const validateAll = useCallback(
    (formValues: T): boolean => {
      const newErrors: FormErrors<T> = {};
      const newTouched: TouchedFields<T> = {};
      for (const field of Object.keys(validators) as (keyof T)[]) {
        const validator = validators[field];
        if (validator) {
          const error = validator(formValues[field], formValues);
          newErrors[field] = error;
          newTouched[field] = true;
        }
      }
      setErrors(newErrors);
      setTouched(newTouched);
      return !Object.values(newErrors).some(Boolean);
    },
    [validators],
  );

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const fieldError = useCallback(
    (field: keyof T) => (touched[field] ? errors[field] : undefined),
    [errors, touched],
  );

  return { errors, touched, handleBlur, validateAll, reset, fieldError };
}

// ── Reusable validators ───────────────────────────────────────────────────────

export const required =
  (label: string) =>
  (value: unknown): string | undefined =>
    !value || (typeof value === "string" && !value.trim())
      ? `${label} is required.`
      : undefined;

export const minLength =
  (label: string, min: number) =>
  (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length < min
      ? `${label} must be at least ${min} characters.`
      : undefined;

export const exactLength =
  (label: string, len: number) =>
  (value: unknown): string | undefined =>
    typeof value === "string" && value.replace(/\D/g, "").length !== len
      ? `${label} must be exactly ${len} digits.`
      : undefined;

export const isEmail =
  () =>
  (value: unknown): string | undefined =>
    typeof value === "string" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? "Enter a valid email address."
      : undefined;

export const combine =
  <T>(...fns: Array<FieldValidator<T>>) =>
  (value: T[keyof T], formValues: T): string | undefined => {
    for (const fn of fns) {
      const error = fn(value, formValues);
      if (error) return error;
    }
    return undefined;
  };
