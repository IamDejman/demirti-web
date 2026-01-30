/**
 * Traffic source attribution: search engine and social domain lists,
 * and traffic channel classification.
 */

export const SEARCH_ENGINE_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'yandex.',
  'search.', 'ecosia.', 'startpage.', 'ask.',
];

export const SOCIAL_DOMAINS = [
  'facebook.', 'fb.', 'instagram.', 'twitter.', 't.co', 'linkedin.',
  'tiktok.', 'pinterest.', 'reddit.', 'youtube.', 'snapchat.',
  'whatsapp.', 'telegram.', 'tumblr.', 'vk.',
];

export const TRAFFIC_CHANNELS = {
  DIRECT: 'direct',
  ORGANIC_SEARCH: 'organic_search',
  PAID_SEARCH: 'paid_search',
  SOCIAL: 'social',
  REFERRAL: 'referral',
  EMAIL: 'email',
  OTHER: 'other',
};

/**
 * Compute traffic channel from UTM params and referrer.
 * @param {object} params - { utmSource, utmMedium, utmCampaign, referrer }
 * @returns {string} One of TRAFFIC_CHANNELS values
 */
export function computeTrafficChannel({ utmSource, utmMedium, utmCampaign, referrer }) {
  const ref = (referrer || '').toLowerCase();
  const source = (utmSource || '').toLowerCase();
  const medium = (utmMedium || '').toLowerCase();

  const hasUtm = !!(utmSource || utmMedium || utmCampaign);
  const hasReferrer = ref.length > 0;

  if (!hasReferrer && !hasUtm) return TRAFFIC_CHANNELS.DIRECT;

  if (medium === 'email') return TRAFFIC_CHANNELS.EMAIL;

  const isPaidMedium = ['cpc', 'ppc', 'paid', 'cpv'].includes(medium);
  const isSearchReferrer = SEARCH_ENGINE_DOMAINS.some((d) => ref.includes(d));
  const isSocialReferrer = SOCIAL_DOMAINS.some((d) => ref.includes(d));
  const isSocialSource = SOCIAL_DOMAINS.some((d) => source.includes(d));

  if (isPaidMedium && (isSearchReferrer || SEARCH_ENGINE_DOMAINS.some((d) => source.includes(d)))) {
    return TRAFFIC_CHANNELS.PAID_SEARCH;
  }

  if (isSearchReferrer && !hasUtm) return TRAFFIC_CHANNELS.ORGANIC_SEARCH;

  if (isSocialReferrer || isSocialSource) return TRAFFIC_CHANNELS.SOCIAL;

  if (hasReferrer) return TRAFFIC_CHANNELS.REFERRAL;

  return TRAFFIC_CHANNELS.OTHER;
}
