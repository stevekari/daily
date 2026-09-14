/**
 * Automatic Transaction Categorization Engine
 * Maps keywords, merchant names, and descriptions to standard budget categories.
 */

export const STANDARD_CATEGORIES = [
  {
    name: "Shopping",
    icon: "🛍️",
    color: "#ec4899",
    description: "Retail, clothes, electronics, Amazon, personal goods",
  },
  {
    name: "Vehicle",
    icon: "🚗",
    color: "#0284c7",
    description: "Car payments, fuel, gas, mechanic, repairs, parking, car wash",
  },
  {
    name: "Transportation",
    icon: "🚆",
    color: "#3b82f6",
    description: "Public transit, bus, train, metro, flights, taxi, Uber, Lyft",
  },
  {
    name: "Investment",
    icon: "📈",
    color: "#10b981",
    description: "Stocks, crypto, ETFs, shares, dividends, trading, savings",
  },
  {
    name: "On Plan Expenses",
    icon: "📋",
    color: "#8b5cf6",
    description: "Fixed monthly bills, rent, mortgage, utilities, tuition, insurance",
  },
  {
    name: "Unplanned Expenses",
    icon: "⚠️",
    color: "#f43f5e",
    description: "Emergencies, urgent fixes, sudden fines, unexpected charges",
  },
  {
    name: "Food & Dining",
    icon: "🍔",
    color: "#f97316",
    description: "Restaurants, groceries, coffee, takeout, supermarket",
  },
  {
    name: "Entertainment",
    icon: "🎬",
    color: "#eab308",
    description: "Streaming, games, movies, concerts, subscriptions, events",
  },
  {
    name: "Health & Medical",
    icon: "💊",
    color: "#14b8a6",
    description: "Pharmacy, doctor visits, dentist, medication, wellness",
  },
  {
    name: "Salary & Income",
    icon: "💰",
    color: "#22c55e",
    description: "Salary, wages, freelancing, bonuses, deposits, dividends",
  },
  {
    name: "General",
    icon: "🏷️",
    color: "#64748b",
    description: "Other / miscellaneous transactions",
  },
];

export const CATEGORY_RULES = [
  {
    category: "Vehicle",
    icon: "🚗",
    color: "#0284c7",
    keywords: [
      "car", "auto", "vehicle", "fuel", "gas", "petrol", "diesel", "shell", "bp",
      "total", "chevron", "exxon", "texaco", "repsol", "mechanic", "car repair",
      "oil change", "tyres", "tires", "car wash", "parking", "garage", "toll",
      "mot", "autozone", "tesla", "toyota", "honda", "ford", "bmw", "audi",
      "mercedes", "volkswagen", "vw", "car insurance", "auto insurance", "gasoline",
      "gas station", "car lease", "car rental", "hertz", "avis", "sixt"
    ]
  },
  {
    category: "Transportation",
    icon: "🚆",
    color: "#3b82f6",
    keywords: [
      "uber", "lyft", "bolt", "cab", "taxi", "bus", "train", "metro", "subway",
      "tram", "railway", "rail", "transit", "commute", "airline", "flight",
      "ryanair", "easyjet", "delta", "lufthansa", "air france", "iberia", "emirates",
      "trainline", "amtrak", "eurostar", "renfe", "sncf", "ferry", "boat",
      "bike share", "scooter", "lime", "bird", "ticket train", "public transport"
    ]
  },
  {
    category: "Investment",
    icon: "📈",
    color: "#10b981",
    keywords: [
      "investment", "invest", "stocks", "stock", "shares", "crypto", "bitcoin", "btc",
      "ethereum", "eth", "binance", "coinbase", "kraken", "trading", "trade", "etf",
      "vanguard", "fidelity", "robinhood", "broker", "brokerage", "dividends", "dividend",
      "yield", "portfolio", "mutual fund", "401k", "nisa", "isa", "real estate", "capital",
      "gold", "silver", "index fund", "degiro", "etoro", "trading212", "revolut invest"
    ]
  },
  {
    category: "On Plan Expenses",
    icon: "📋",
    color: "#8b5cf6",
    keywords: [
      "on plan", "planned", "fixed bill", "rent", "mortgage", "housing", "electric",
      "electricity", "water bill", "gas utility", "wifi", "internet", "broadband",
      "telecom", "utility", "tuition", "school", "college", "insurance", "life insurance",
      "health insurance", "property tax", "subscription", "recurring", "scheduled",
      "monthly fee", "phone bill", "vodafone", "orange", "movistar", "at&t", "verizon"
    ]
  },
  {
    category: "Unplanned Expenses",
    icon: "⚠️",
    color: "#f43f5e",
    keywords: [
      "unplanned", "unexpected", "emergency", "urgent", "fine", "penalty", "speeding",
      "parking ticket", "penalty fee", "breakdown", "towing", "plumber emergency",
      "broken", "replacement", "accident fee", "damage fee", "late fee"
    ]
  },
  {
    category: "Food & Dining",
    icon: "🍔",
    color: "#f97316",
    keywords: [
      "coffee", "cafe", "starbucks", "dunkin", "costa", "restaurant", "dinner", "lunch",
      "breakfast", "brunch", "pizza", "burger", "mcdonald", "kfc", "subway", "domino",
      "tacobell", "sushi", "bakery", "bar", "pub", "beer", "wine", "drinks", "food",
      "supermarket", "grocery", "groceries", "walmart", "target", "costco", "aldi",
      "lidl", "carrefour", "mercadona", "tesco", "kroger", "trader", "whole foods",
      "ubereats", "deliveroo", "justeat", "doordash", "glovo"
    ]
  },
  {
    category: "Shopping",
    icon: "🛍️",
    color: "#ec4899",
    keywords: [
      "shopping", "amazon", "ebay", "apple", "google", "microsoft", "electronics",
      "clothes", "clothing", "fashion", "zara", "h&m", "nike", "adidas", "puma",
      "shoes", "mall", "store", "shop", "hardware", "gadget", "laptop", "phone",
      "shein", "asos", "best buy", "ikea", "aliexpress", "boutique", "apparel"
    ]
  },
  {
    category: "Entertainment",
    icon: "🎬",
    color: "#eab308",
    keywords: [
      "netflix", "spotify", "disney", "hulu", "hbo", "cinema", "movie", "theater",
      "concert", "ticket", "game", "steam", "playstation", "xbox", "nintendo", "gym",
      "fitness", "club", "party", "festival", "youtube", "twitch", "prime video"
    ]
  },
  {
    category: "Health & Medical",
    icon: "💊",
    color: "#14b8a6",
    keywords: [
      "pharmacy", "medicine", "doctor", "dentist", "hospital", "clinic", "health",
      "drugs", "care", "wellness", "therapy", "optician", "prescription", "vitamins",
      "dental", "medical", "physiotherapy", "lab", "consultation"
    ]
  },
  {
    category: "Salary & Income",
    icon: "💰",
    color: "#22c55e",
    keywords: [
      "salary", "paycheck", "bonus", "dividend", "interest", "refund", "freelance",
      "client payment", "stripe", "paypal receive", "deposit", "wage", "reimbursement",
      "pension", "cashback", "grant"
    ]
  }
];

/**
 * Detect category name from text (name, description, or notes)
 */
export function autoCategorize(text) {
  if (!text || typeof text !== "string") return null;
  const clean = text.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        return rule.category;
      }
    }
  }

  return null;
}

/**
 * Returns full metadata for the detected category
 */
export function autoCategorizeMeta(text) {
  if (!text || typeof text !== "string") return null;
  const clean = text.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        return {
          category: rule.category,
          icon: rule.icon,
          color: rule.color,
          isIncome: rule.category === "Salary & Income",
          matchedKeyword: kw,
        };
      }
    }
  }

  return null;
}

/**
 * Returns icon and color for any category name
 */
export function getCategoryMeta(categoryName) {
  if (!categoryName) {
    return { category: "General", icon: "🏷️", color: "#64748b" };
  }

  const nameLower = categoryName.toLowerCase().trim();
  const match =
    CATEGORY_RULES.find((r) => r.category.toLowerCase() === nameLower) ||
    STANDARD_CATEGORIES.find((c) => c.name.toLowerCase() === nameLower);

  if (match) {
    return {
      category: match.category || match.name,
      icon: match.icon,
      color: match.color,
    };
  }

  // Fallback keyword matching for legacy / custom strings
  if (nameLower.includes("shop")) return { category: "Shopping", icon: "🛍️", color: "#ec4899" };
  if (nameLower.includes("car") || nameLower.includes("vehic") || nameLower.includes("fuel")) return { category: "Vehicle", icon: "🚗", color: "#0284c7" };
  if (nameLower.includes("trans")) return { category: "Transportation", icon: "🚆", color: "#3b82f6" };
  if (nameLower.includes("invest")) return { category: "Investment", icon: "📈", color: "#10b981" };
  if (nameLower.includes("plan")) return { category: "On Plan Expenses", icon: "📋", color: "#8b5cf6" };
  if (nameLower.includes("food") || nameLower.includes("din")) return { category: "Food & Dining", icon: "🍔", color: "#f97316" };
  if (nameLower.includes("health") || nameLower.includes("med")) return { category: "Health & Medical", icon: "💊", color: "#14b8a6" };
  if (nameLower.includes("entertain")) return { category: "Entertainment", icon: "🎬", color: "#eab308" };
  if (nameLower.includes("income") || nameLower.includes("salary")) return { category: "Salary & Income", icon: "💰", color: "#22c55e" };

}
