export function validateKey(input: string): boolean {
  const accessKey = import.meta.env.VITE_ACCESS_KEY;
  if (!accessKey) return false;
  return input.trim().toLowerCase() === accessKey.toLowerCase();
}
