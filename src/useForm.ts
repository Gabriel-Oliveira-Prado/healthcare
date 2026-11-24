import { useMemo, useState } from "react";

type Validators<K extends string> = Record<
  K,
  (value: string, values: Record<K, string>) => string
>;

/**
 * Estado de formulário com validação. O erro de um campo só aparece depois que
 * a pessoa sai dele (blur) ou tenta enviar, e some quando ela volta a digitar
 * em um campo que recebeu erro do "servidor".
 */
export function useForm<K extends string>(validators: Validators<K>) {
  const keys = Object.keys(validators) as K[];
  const [values, setValues] = useState(
    () => Object.fromEntries(keys.map((key) => [key, ""])) as Record<K, string>,
  );
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<K, string>>>(
    {},
  );

  const errors = useMemo(
    () =>
      Object.fromEntries(
        keys.map((key) => [key, validators[key](values[key], values)]),
      ) as Record<K, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values],
  );

  return {
    values,
    /** Erro que deve aparecer na tela para o campo. */
    errorOf: (key: K) => serverErrors[key] || (touched[key] ? errors[key] : ""),
    change: (key: K, value: string) => {
      setValues((previous) => ({ ...previous, [key]: value }));
      setServerErrors((previous) =>
        previous[key] ? { ...previous, [key]: "" } : previous,
      );
    },
    blur: (key: K) => setTouched((previous) => ({ ...previous, [key]: true })),
    /** Marca todos os campos como visitados e informa se o formulário é válido. */
    validateAll: () => {
      setTouched(
        Object.fromEntries(keys.map((key) => [key, true])) as Record<
          K,
          boolean
        >,
      );
      return keys.every((key) => !errors[key]);
    },
    setServerError: (key: K, message: string) =>
      setServerErrors((previous) => ({ ...previous, [key]: message })),
    reset: () => {
      setValues(
        Object.fromEntries(keys.map((key) => [key, ""])) as Record<K, string>,
      );
      setTouched({});
      setServerErrors({});
    },
  };
}
