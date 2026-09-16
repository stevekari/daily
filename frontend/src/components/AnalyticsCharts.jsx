import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { getCategoryMeta } from "../utils/autoCategorizer";
import { generateSmartInsights } from "../utils/smartInsights";
import { printMonthlyFinancialReport } from "../utils/exportUtils";
import AnimatedNumber from "./AnimatedNumber";

export default function AnalyticsCharts({
  transactions = [],
  budgetAmount = 1000,
  dailyLimit = 35,
  currencySymbol = "€",
  username = "User",
}) {
  const { t } = useLanguage();
  const [targetDate, setTargetDate] = useState(new Date());

  const insightsData = generateSmartInsights({
    transactions,
    monthlyBudget: budgetAmount,
    dailyLimit,
    currencySymbol,
    targetDate,
  });

}
