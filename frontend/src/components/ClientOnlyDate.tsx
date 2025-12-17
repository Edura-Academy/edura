'use client';

import { useState, useEffect } from 'react';

interface ClientOnlyDateProps {
  dateString: string;
  options?: Intl.DateTimeFormatOptions;
}

export default function ClientOnlyDate({ dateString, options }: ClientOnlyDateProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    try {
      const date = new Date(dateString);
      // 'tr-TR' locale and default options can be customized via props
      const effectiveOptions = options || { year: 'numeric', month: 'long', day: 'numeric' };
      setFormattedDate(date.toLocaleDateString('tr-TR', effectiveOptions));
    } catch (error) {
      console.error("Invalid date string provided:", dateString);
      setFormattedDate('Geçersiz Tarih'); // Fallback for invalid dates
    }
  }, [dateString, options]);

  // Render a placeholder on the server and initial client render
  if (!formattedDate) {
    // To prevent layout shift, you can render a placeholder with a similar size.
    // For example, 'DD.MM.YYYY' -> '00.00.0000'
    return <span>&nbsp;</span>; 
  }

  return <span>{formattedDate}</span>;
}
