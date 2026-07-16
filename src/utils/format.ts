export const formatCurrency = (amount: number): string =>
    `${Math.abs(amount).toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const CURRENCY_LABELS: Record<string, string> = {
    bsc: "$",
    usdt: "USDT",
    eur: "€",
};

export const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};
