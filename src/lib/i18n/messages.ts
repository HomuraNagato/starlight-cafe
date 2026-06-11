import { derived } from 'svelte/store';
import { locale } from '$lib/stores/language.store';
import { translations } from './translations';

export const messages = derived(locale, ($locale) => translations[$locale] ?? translations.en);
