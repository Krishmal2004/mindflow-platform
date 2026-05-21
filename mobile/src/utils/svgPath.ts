/**
 * Figma/design-tool exports often glue commands to numbers:
 *   "M107.512"  "65.5452V63"  "61.3073V65"
 * react-native-svg requires spaces: "M 107.512" "65.5452 V 63" "61.3073 V 65"
 */
export function normalizeSvgPath(d: string): string {
    if (!d) return d;
    return d
        .replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ')
        .replace(/\s+/g, ' ')
        .trim();
}
