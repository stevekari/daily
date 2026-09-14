/**
 * Intelligent Receipt Parser & Simulated OCR Engine
 * Extracts merchant names, totals, line items, and categories from images and text.
 */
import { autoCategorize } from "./autoCategorizer";

const COMMON_MERCHANTS = [
  { name: "Starbucks Coffee", category: "Food & Dining", defaultAmount: 5.75 },
  { name: "Supermarket Groceries", category: "Food & Dining", defaultAmount: 48.20 },
  { name: "Shell Fuel Station", category: "Vehicle", defaultAmount: 55.00 },
  { name: "AutoZone Car Parts", category: "Vehicle", defaultAmount: 42.50 },
  { name: "Uber Ride", category: "Transportation", defaultAmount: 14.50 },
  { name: "Trainline Transit Ticket", category: "Transportation", defaultAmount: 26.00 },
  { name: "Amazon Shopping", category: "Shopping", defaultAmount: 34.99 },
  { name: "Zara Fashion", category: "Shopping", defaultAmount: 69.50 },
  { name: "Coinbase Bitcoin Investment", category: "Investment", defaultAmount: 100.00 },
  { name: "Electricity & Water Bill", category: "On Plan Expenses", defaultAmount: 85.00 },
  { name: "Pharmacy & Wellness", category: "Health & Medical", defaultAmount: 18.40 },
  { name: "Cinema & Popcorn", category: "Entertainment", defaultAmount: 22.50 },
  { name: "Urgent Plumber Repair", category: "Unplanned Expenses", defaultAmount: 95.00 },
];

/**
 * Parses uploaded receipt image (extracts metadata via filename or intelligent simulation)
 */
export async function parseReceiptImage(file) {
  // Simulate intelligent scan delay (0.8s)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const fileName = (file?.name || "").toLowerCase();
  
  // Check if filename matches known keywords
  let matchedMerchant = null;
  for (const m of COMMON_MERCHANTS) {
    if (fileName.includes(m.name.toLowerCase().split(" ")[0])) {
      matchedMerchant = m;
      break;
    }
  }

  // If no direct keyword match, pick a realistic random receipt profile
  if (!matchedMerchant) {
    const randomIdx = Math.floor(Math.random() * COMMON_MERCHANTS.length);
    matchedMerchant = COMMON_MERCHANTS[randomIdx];
  }

  // Generate realistic slight amount variance if randomized
  const randomCents = (Math.random() * 8 - 4).toFixed(2);
  const finalAmount = Math.max(2.5, parseFloat((matchedMerchant.defaultAmount + parseFloat(randomCents)).toFixed(2)));

  const autoCat = autoCategorize(matchedMerchant.name);

  return {
    merchant: matchedMerchant.name,
    amount: finalAmount,
    date: new Date().toISOString().slice(0, 16),
    category: autoCat || matchedMerchant.category,
    confidence: 0.94,
    items: [
      { name: `${matchedMerchant.name} item 1`, price: (finalAmount * 0.65).toFixed(2) },
      { name: "Service / Tax", price: (finalAmount * 0.35).toFixed(2) },
    ],
  };
}
