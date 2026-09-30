import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('locale');
  const validLocales = ['ru', 'kk'];
  const locale = (localeCookie && validLocales.includes(localeCookie.value))
    ? localeCookie.value
    : 'ru';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

