import dayjs from 'dayjs';

export const formatDate = (date: Date | string) => {
    return dayjs(date).format('MMM D, YYYY');
};

export const formatCurrency = (amount: number | string | any) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
    }).format(Number(amount));
};

export const formatPercentage = (rate: number | string) => {
    return `${(Number(rate) * 100).toFixed(2)}%`;
};
