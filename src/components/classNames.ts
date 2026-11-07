/** Joins CSS class names, skipping empty ones: cx('a', false, 'b') -> 'a b'. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
