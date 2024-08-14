export function toCamelCase(str: string): string {
  const cleanStr = str.replace(/[^a-zA-Z0-9 ]/g, '');

  const words = cleanStr.split(' ');

  const camelCaseWords = words.map((word, index) => {
    if (index === 0) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return camelCaseWords.join('');
}
