

export function getUniqueName(baseName: string): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `${baseName}-${random}`;
};