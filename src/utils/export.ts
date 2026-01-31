import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { formatDate, formatCurrency } from './dateHelpers';
import dayjs from 'dayjs';

export const exportToExcel = (investments: any[], fileName = 'treasury_report') => {
    const data = investments.map(inv => ({
        Bank: inv.bank.name,
        Principal: formatCurrency(inv.principal),
        'Daily Rate': `${(inv.dailyRate * 100).toFixed(3)}%`,
        'Start Date': formatDate(inv.startDate),
        'Maturity Date': formatDate(inv.maturityDate),
        Status: inv.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investments");

    // @ts-ignore - XLSX types might be slightly off for write
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (investments: any[], fileName = 'treasury_report') => {
    const data = investments.map(inv => ({
        Bank: inv.bank.name,
        Principal: inv.principal, // Keep raw numbers for CSV
        DailyRate: inv.dailyRate,
        StartDate: dayjs(inv.startDate).format('YYYY-MM-DD'),
        MaturityDate: dayjs(inv.maturityDate).format('YYYY-MM-DD'),
        Status: inv.status
    }));

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
