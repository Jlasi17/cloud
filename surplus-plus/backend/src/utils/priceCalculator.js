const calculateTimeDiscount = (spoilTime) => {
  const now = new Date();
  const timeUntilSpoil = (new Date(spoilTime) - now) / (1000 * 60 * 60); // in hours
  
  // If already spoiled or very close to spoiling (less than 1 hour), minimum price
  if (timeUntilSpoil <= 1) {
    return 0.1; // 10% of original price
  }
  
  // If more than 72 hours until spoiling, no time-based discount
  if (timeUntilSpoil > 72) {
    return 1.0;
  }
  
  // Linear discount between 72 hours and 1 hour
  // At 72 hours: 100% of price
  // At 1 hour: 10% of price
  return 0.1 + (0.9 * (timeUntilSpoil - 1) / 71);
};

const calculateQuantityDiscount = (quantity) => {
  // Bulk discount tiers
  if (quantity >= 100) return 0.7;  // 30% discount for very large quantities
  if (quantity >= 50) return 0.8;   // 20% discount for large quantities
  if (quantity >= 20) return 0.9;   // 10% discount for medium quantities
  return 1.0;                       // No discount for small quantities
};

const calculateFinalPrice = (donation) => {
  const {
    estimatedValue,
    spoilTime,
    quantity,
    foodType
  } = donation;

  // Base price per unit
  const basePrice = estimatedValue / quantity;

  // Calculate discounts
  const timeDiscount = calculateTimeDiscount(spoilTime);
  const quantityDiscount = calculateQuantityDiscount(quantity);

  // Food type multiplier (some foods retain value better than others)
  const foodTypeMultiplier = {
    'Pulses': 0.9,        // Pulses retain value well
    'Packet Food': 0.85,  // Packaged foods retain value well
    'Fruits & Vegetables': 0.7, // Fresh produce loses value faster
    'Cooked Food': 0.5,   // Cooked food loses value fastest
    'Other': 0.8
  }[foodType] || 0.8;

  // Calculate final price per unit
  const discountedPricePerUnit = basePrice * timeDiscount * quantityDiscount * foodTypeMultiplier;

  // Calculate total price
  const totalPrice = Math.round(discountedPricePerUnit * quantity);

  return {
    originalPrice: estimatedValue,
    finalPrice: totalPrice,
    discountPercentage: Math.round((1 - (totalPrice / estimatedValue)) * 100),
    priceBreakdown: {
      basePrice: basePrice,
      timeDiscount: Math.round(timeDiscount * 100),
      quantityDiscount: Math.round(quantityDiscount * 100),
      foodTypeMultiplier: Math.round(foodTypeMultiplier * 100),
      pricePerUnit: Math.round(discountedPricePerUnit)
    }
  };
};

module.exports = {
  calculateFinalPrice
}; 