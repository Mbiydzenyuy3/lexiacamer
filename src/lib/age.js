/**
 * The parent gives an age, not a birth date: nobody has to look one up, and
 * we hold less. It is stored as an ESTIMATED date (today minus the age),
 * because the school views and the anonymous age-band totals already compute
 * age from students.date_of_birth. The app never displays that date.
 */
export function estimatedBirthDate(age, today = new Date()) {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().slice(0, 10);
}
