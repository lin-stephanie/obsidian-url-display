import { moment } from 'obsidian';

import ar from './locales/ar';
import cz from './locales/cz';
import da from './locales/da';
import de from './locales/de';
import en from './locales/en';
import enGB from './locales/en-gb';
import es from './locales/es';
import fr from './locales/fr';
import hi from './locales/hi';
import id from './locales/id';
import it from './locales/it';
import ja from './locales/ja';
import ko from './locales/ko';
import nl from './locales/nl';
import no from './locales/no';
import pl from './locales/pl';
import pt from './locales/pt';
import ptBR from './locales/pt-br';
import ro from './locales/ro';
import ru from './locales/ru';
import tr from './locales/tr';
import zhCN from './locales/zh-cn';
import zhTW from './locales/zh-tw';

const localeMap: { [k: string]: Partial<typeof en> } = {
  ar,
  cs: cz,
  da,
  de,
  en,
  'en-gb': enGB,
  es,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  nl,
  nn: no,
  pl,
  pt,
  'pt-br': ptBR,
  ro,
  ru,
  tr,
  'zh-cn': zhCN,
  'zh-tw': zhTW,
};


// const lang = window.localStorage.getItem("language");
// const locale = localeMap[lang || "en"];
const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en, vars?: { [key: string]: string | number }): string {
	let translation = (locale && locale[str]) || en[str];
  
	if (vars) {
	  Object.keys(vars).forEach(key => {
		const value = vars[key];
		translation = translation.replace(new RegExp(`{${key}}`, 'g'), value.toString());
	  });
	}
  
	return translation;
}
