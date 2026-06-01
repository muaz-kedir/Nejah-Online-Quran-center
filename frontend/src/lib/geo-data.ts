import { Country, City } from 'country-state-city';

export function getCountryIsoByName(countryName: string): string {
  if (!countryName) return '';
  return Country.getAllCountries().find((c) => c.name === countryName)?.isoCode ?? '';
}

/** Deduplicated city names for a country ISO code (Ethiopia has duplicate zone names in the dataset). */
export function getUniqueCityNames(countryIsoCode: string): string[] {
  if (!countryIsoCode) return [];
  const cities = City.getCitiesOfCountry(countryIsoCode) ?? [];
  return [...new Set(cities.map((c) => c.name))];
}

export function getUniqueCityNamesByCountryName(countryName: string): string[] {
  return getUniqueCityNames(getCountryIsoByName(countryName));
}
