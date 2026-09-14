export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const DAYS_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    name: "Water",
    amount: 5,
    dateTime: new Date().toISOString(),
    type: "EXPENSE",
    category: "Utilities",
  },
  {
    id: 2,
    name: "Food",
    amount: 85,
    dateTime: new Date().toISOString(),
    type: "EXPENSE",
    category: "Food",
  },
  {
    id: 3,
    name: "Tickets",
    amount: 360,
    dateTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "EXPENSE",
    category: "Entertainment",
  },
];

export const TOTAL_BUDGET = 1200;
export const DAILY_LIMIT = 100;
