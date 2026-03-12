/**
 * Formats a date string (ISO or SQLite format) into Indian Standard Time (IST).
 * This is used for backend operations like email generation.
 */
export function formatDateIST(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';

    try {
        // Ensure the date string is treated as UTC if it lacks a timezone indicator
        let isoStr = dateStr;
        if (!isoStr.includes('Z') && !isoStr.includes('+')) {
            isoStr += 'Z';
        }

        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return dateStr;

        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'medium',
            hour12: true,
        }).format(date);
    } catch (e) {
        console.error('Error formatting date to IST:', e);
        return dateStr;
    }
}
