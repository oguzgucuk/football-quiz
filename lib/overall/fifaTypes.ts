/**
 * FIFA Prime veritabanı kayıt ve aday tipleri.
 */

export interface FifaPlayerRecord {
  shortName: string;
  longName: string;
  dob: string; // YYYY-MM-DD
  nationality: string;
  maxOverall: number;
  positions: string[];
}

export interface DbPlayerRecord {
  id: string;
  fullName: string;
  birthDate: Date | null;
  nationality: string | null;
}
