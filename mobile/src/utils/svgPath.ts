// Figma exports glue SVG path commands to numbers (e.g. "M107.512"); react-native-svg requires spaces ("M 107.512").
export function normalizeSvgPath(d: string): string {
    if (!d) return d;
    return d
        .replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ')
        .replace(/\s+/g, ' ')
        .trim();
}
