import { useLanguageStore } from '@/stores/language';
import { pl } from './pl';
import { en } from './en';

export { pl, en };
export type { Translations } from './pl';

export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  return lang === 'en' ? en : pl;
}
