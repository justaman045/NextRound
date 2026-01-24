export type Currency = 'INR' | 'USD' | 'EUR';

export const PRICING_CONFIG = {
    currencies: {
        INR: { symbol: '₹', code: 'INR' },
        USD: { symbol: '$', code: 'USD' },
        EUR: { symbol: '€', code: 'EUR' }
    },
    plans: {
        free: {
            name: 'Free Tier',
            pricing: {
                INR: { amount: 0, display: '0' },
                USD: { amount: 0, display: '0' },
                EUR: { amount: 0, display: '0' }
            },
            billingInterval: 'forever',
            features: [
                '1 AI Resume Limit',
                'Basic Template',
                'PDF Export'
            ]
        },
        pro: {
            name: 'Pro Monthly',
            pricing: {
                INR: { amount: 799, display: '799' },
                USD: { amount: 9, display: '9' },
                EUR: { amount: 9, display: '9' }
            },
            billingInterval: 'mo',
            features: [
                'Unlimited AI Resumes',
                'All Premium Templates',
                'Advanced AI Actions'
            ]
        },
        pro_saver: {
            name: 'Pro Saver',
            pricing: {
                INR: { amount: 2499, display: '2499', monthlyEquivalent: '416' },
                USD: { amount: 29, display: '29', monthlyEquivalent: '4.83' },
                EUR: { amount: 29, display: '29', monthlyEquivalent: '4.83' }
            },
            billingInterval: '6 mo',
            features: [
                'Everything in Pro',
                'Priority Support',
                'LinkedIn Import',
                'Cover Letter AI'
            ]
        }
    }
};

export const DEFAULT_CURRENCY: Currency = 'INR';

export function getCurrencyFromLocale(locale: string, timeZone: string): Currency {
    // 1. Check Timezone (Most accurate for geographic location)
    if (timeZone.includes('Kolkata') || timeZone.includes('Calcutta') || timeZone.includes('Asia/India')) return 'INR';

    // 2. Check Locale
    if (locale.includes('IN')) return 'INR';
    if (locale.includes('US')) return 'USD';

    const euroLocales = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'EU'];
    const euroTimeZones = ['Europe/Berlin', 'Europe/Paris', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam'];

    if (euroLocales.some(code => locale.includes(code))) return 'EUR';
    if (euroTimeZones.some(tz => timeZone.includes(tz))) return 'EUR';

    return 'USD'; // Default fallback for international
}
