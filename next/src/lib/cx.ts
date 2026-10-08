/** Astro's class:list semantics: strings, arrays, objects of booleans; falsy values dropped. */
type ClassValue = string | number | false | null | undefined | ClassValue[] | Record<string, unknown>;
export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  const add = (v: ClassValue) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === 'object') { for (const [k, on] of Object.entries(v)) if (on) out.push(k); }
    else out.push(String(v));
  };
  values.forEach(add);
  return [...new Set(out.join(' ').split(/\s+/).filter(Boolean))].join(' ');
}
