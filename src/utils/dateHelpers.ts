import dayjs from 'dayjs';

export const formatDate = (date: Date | string) => {
    return dayjs(date).format('MMM D, YYYY');
};

export const formatCurrency = (amount: number | string | any, currencyCode: string = 'NGN') => {
    const locale = currencyCode === 'NGN' ? 'en-NG' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
    }).format(Number(amount));
};

export const formatPercentage = (rate: number | string) => {
    return `${(Number(rate) * 100).toFixed(2)}%`;
};
