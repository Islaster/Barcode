export function toGtin13(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 13) return digits;
  if (digits.length === 12) return `0${digits}`;
  if (digits.length === 8) return digits.padStart(13, "0");

  throw new Error(
    "Unsupported barcode length. Expected UPC-A, EAN-8, or EAN-13."
  );
}
