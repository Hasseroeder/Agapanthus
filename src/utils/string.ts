export function signedNumberFixedString(input: number, fixed: number): string {
  if (input === undefined || Number.isNaN(input)) return "NaN";
  const sign = input < 0 ? "-" : "+";
  return `${sign}${Math.abs(Number(input.toFixed(fixed)))}`;
}

export function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1) : "";
}
