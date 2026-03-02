export function generateSlug(name1: string, name2: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  return `${normalize(name1)}-y-${normalize(name2)}`;
}
