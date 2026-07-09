import { Country } from 'country-state-city';

export function getCountryIsoByName(countryName: string): string {
  if (!countryName) return '';
  return Country.getAllCountries().find((c) => c.name === countryName)?.isoCode ?? '';
}

/** Deduplicated city names for a country ISO code (Ethiopia has duplicate zone names in the dataset). */
export async function getUniqueCityNames(countryIsoCode: string): Promise<string[]> {
  if (!countryIsoCode) return [];
  const { City } = await import('country-state-city');
  const cities = City.getCitiesOfCountry(countryIsoCode) ?? [];
  return [...new Set(cities.map((c) => c.name))];
}

export async function getUniqueCityNamesByCountryName(countryName: string): Promise<string[]> {
  return getUniqueCityNames(getCountryIsoByName(countryName));
}
