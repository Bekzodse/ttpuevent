import { Locale } from "../types";
import { en } from "./en";
import { uz } from "./uz";
import { ru } from "./ru";

export const dictionaries: Record<Locale, typeof en> = {
  en,
  uz: uz as unknown as typeof en,
  ru: ru as unknown as typeof en,
};
