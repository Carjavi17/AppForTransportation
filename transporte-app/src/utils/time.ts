export function minutesSince(isoDate: string) {
  return Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
}