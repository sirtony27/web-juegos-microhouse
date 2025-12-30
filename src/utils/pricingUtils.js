export const calculateProductPrice = (cost, customMargin, discountPercent, globalSettings, useManualPrice = 0, currency = 'ARS') => {
    // 1. If Manual Price is set and valid, it overrides everything (except maybe discount? No, usually manual overrides final).
    // However, the user wants discounts to work.
    // Let's assume Manual Price = "Base Selling Price" before discount?
    // Or Manual Price = Final Price?
    // The current logic in sync was: if manual override exists (not handled in sync), use it.
    // But let's standarize: 
    // If Manual Price > 0, that is the BASE price (Pre-discount).
    // If Manual Price == 0, calculated from Cost + Margin.

    let basePrice = 0;
    const { globalMargin = 30, vatRate = 21, enableVatGlobal = false, exchangeRate = 1200 } = globalSettings;

    // Convert Cost to ARS if currency is USD
    let effectiveCost = parseFloat(cost) || 0;
    if (currency === 'USD') {
        effectiveCost = effectiveCost * parseFloat(exchangeRate);
    }

    if (useManualPrice > 0) {
        basePrice = parseFloat(useManualPrice);
    } else {
        const validCost = effectiveCost;
        const validMargin = (customMargin !== undefined && customMargin !== null && customMargin !== '')
            ? parseFloat(customMargin)
            : parseFloat(globalMargin);

        basePrice = validCost * (1 + (validMargin / 100));

        // Apply VAT logic
        // We need to know if we should apply VAT. 
        // In the store logic, we checked `product.applyVat`. 
        // For simplicity in this helper, let's assume if enableVatGlobal is true, we apply it.
        // Or we pass a flag `applyVat`.
        if (enableVatGlobal) {
            basePrice = basePrice * (1 + (parseFloat(vatRate) / 100));
        }
    }

    // Round Base Price
    basePrice = Math.ceil(basePrice / 100) * 100;

    // Apply Discount
    let finalPrice = basePrice;
    const distinctDiscount = parseFloat(discountPercent) || 0;
    if (distinctDiscount > 0) {
        finalPrice = basePrice * (1 - (distinctDiscount / 100));
        finalPrice = Math.ceil(finalPrice / 100) * 100;
    }

    return {
        basePrice,       // The price crossed out (if discount)
        finalPrice       // The selling price
    };
};
