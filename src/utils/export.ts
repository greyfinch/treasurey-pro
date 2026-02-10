import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { formatDate, formatCurrency } from './dateHelpers';
import dayjs from 'dayjs';

export const exportToExcel = (investments: any[], fileName = 'treasury_report') => {
    const data = investments.map(inv => {
        const providerName = inv.bank?.name || inv.issuer?.name || inv.counterparty?.name || 'Unknown';
        const principalValue = inv.principal || inv.faceValue;
        const rateValue = inv.dailyRate || inv.couponRate || 0;

        return {
            Provider: providerName,
            Principal: formatCurrency(principalValue, inv.currency),
            Rate: typeof rateValue === 'number' ? `${(rateValue * 100).toFixed(3)}%` : `${rateValue}%`,
            'Start Date': formatDate(inv.startDate || inv.settlementDate || inv.tradeDate),
            'Maturity Date': formatDate(inv.maturityDate),
            Status: inv.status
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investments");

    // @ts-ignore - XLSX types might be slightly off for write
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (investments: any[], fileName = 'treasury_report') => {
    const data = investments.map(inv => {
        const providerName = inv.bank?.name || inv.issuer?.name || inv.counterparty?.name || 'Unknown';
        return {
            Bank: providerName,
            Principal: inv.principal || inv.faceValue, // Keep raw numbers for CSV
            DailyRate: inv.dailyRate || inv.couponRate || 0,
            StartDate: dayjs(inv.startDate || inv.settlementDate || inv.tradeDate).format('YYYY-MM-DD'),
            MaturityDate: dayjs(inv.maturityDate).format('YYYY-MM-DD'),
            Status: inv.status
        };
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
