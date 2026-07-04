import { getRequestConfig } from "next-intl/server";

// Único locale por ahora: español. Sin routing i18n.
export default getRequestConfig(async () => {
  const locale = "es";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
