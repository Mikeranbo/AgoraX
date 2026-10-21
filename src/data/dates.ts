// Fixed names: Intl's en-GB short month is "Sept" on newer ICU builds, "Sep" on older ones.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Closes 10 Nov" for the signup deadline; "Closed" once past; "" when there is no usable date. */
export function closesLabel(deadline: string | undefined, now: Date): string {
  if (!deadline) return '';
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return '';
  if (d.getTime() < now.getTime()) return 'Closed';
  return `Closes ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
