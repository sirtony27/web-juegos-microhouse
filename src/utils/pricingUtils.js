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

        // --- MARGIN LOGIC START ---
        let marginToUse = parseFloat(globalMargin);

        // Check if Custom Margin is set (Priority 1)
        if (customMargin !== undefined && customMargin !== null && customMargin !== '') {
            marginToUse = parseFloat(customMargin);
        }
        // Check if Tiered Margins are enabled (Priority 2)
        else if (globalSettings.enableTieredMargins && Array.isArray(globalSettings.marginTiers) && globalSettings.marginTiers.length > 0) {
            // Calculate Cost in USD for comparison (Tiers are always in USD)
            let costForTierCheck = parseFloat(cost) || 0;
            if (currency === 'ARS') {
                // If cost is in ARS, convert back to USD approximately to check tier
                // This handles cases where we only have ARS cost (rare now, but safely handled)
                costForTierCheck = costForTierCheck / parseFloat(exchangeRate || 1);
            }

            // Find matching tier
            // We assume tiers are: { maxPrice: 30, percentage: 50 }
            // Finds the FIRST tier where cost <= maxPrice
            // Finds the FIRST tier where cost <= maxPrice
            const matchingTier = [...globalSettings.marginTiers]
                .sort((a, b) => a.maxPrice - b.maxPrice)
                .find(tier => costForTierCheck <= parseFloat(tier.maxPrice));

            if (matchingTier) {
                marginToUse = parseFloat(matchingTier.percentage);
            }
            // If no tier matches (e.g. cost > highest maxPrice), fall back to globalMargin
        }
        // --- MARGIN LOGIC END ---

        basePrice = validCost * (1 + (marginToUse / 100));

        // Apply VAT logic
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
