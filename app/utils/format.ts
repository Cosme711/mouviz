const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' })

export const countryName = (code: string) => {
  try { return regionNames.of(code) ?? code } catch { return code }
}
