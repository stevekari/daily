import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    language: "Language",
    chooseLanguage: "Choose your language",
    chooseLanguageHint: "You can change this later in Settings.",
    continue: "Continue",
    settings: "Settings",
    yourName: "Your name",
    monthlyBudget: "Monthly budget (€)",
    dailyLimit: "Daily limit (€) - optional",
    save: "Save",
    cancel: "Cancel",
    welcomeBack: "Welcome back",
    logout: "Logout",
    personalFinanceTracker: "Personal finance tracker",
    username: "Username",
    password: "Password",
    login: "Login",
    loggingIn: "Logging in...",
    enterUsername: "Enter username",
    enterPassword: "Enter password",
    monthlyBudgetShort: "Monthly budget",
    spent: "Spent",
    income: "Income",
    remaining: "Remaining",
    addTransaction: "Add transaction",
    transactions: "Transactions",
    noTransactions: "No transactions yet.",
    addOneToGetStarted: "Add one to get started!",
    expense: "Expense",
    incomeType: "Income",
    namePlaceholder: "Name (e.g., Coffee)",
    amountPlaceholder: "Amount (€)",
    categoryPlaceholder: "Category (e.g., Food)",
    reasonPlaceholder: "Reason / note (e.g., lunch with team)",
    addTransactionButton: "Add transaction",
    setBudget: "Set budget",
    clickSettingsToChange: "Click Settings to change",
    used: "Used",
    budgetUsed: "of budget used",
    current: "Current",
    notSet: "Not set",
    leaveBlank: "Leave blank to keep the current budget",
    pleaseFillNameAmount: "Please fill in name and amount",
    areYouSureLogout: "Are you sure you want to logout?",
    loading: "Loading...",
    brandSub: "Personal finance tracker", editName: "Click to edit", recentDaily: "Recent daily", recentWeekly: "Recent weekly", recentMonthly: "Recent monthly", welcome: "Welcome back", email: "Email", firstName: "First name", lastName: "Last name", chooseUsername: "Choose username", enterEmail: "Enter email", firstNamePlaceholder: "First name", lastNamePlaceholder: "Last name", minPassword: "Min 6 characters", confirmPassword: "Confirm password", monthlyBudgetOptional: "Monthly budget (€) - optional", budgetExample: "e.g. 1500", register: "Register", registering: "Registering...", createAccount: "Create account", appTitle: "Steve Budget", backToLogin: "Back to login", daily: "Daily", weekly: "Weekly", monthly: "Monthly", noAccount: "Don't have an account?", registerHere: "Register here",
    changeLanguage: "Change language",
    usernameRequired: "Username is required",
    emailRequired: "Email is required",
    passwordMinLength: "Password must be at least 8 characters with upper, lower, number & symbol",
    passwordsDontMatch: "Passwords do not match",
    loginSuccessful: "Login successful! Redirecting...",
    registerSuccessful: "Registration successful! Redirecting to login...",
    registerSuccessfulHome: "Account created successfully! Welcome, taking you straight home...",
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Login here",
    pwdLength: "8+ characters",
    pwdUpper: "1 uppercase letter",
    pwdLower: "1 lowercase letter",
    pwdNumber: "1 number",
    pwdSpecial: "1 special symbol (@$!%*?&#)",
    pwdStrength: "Password Strength",
    pwdWeak: "Weak",
    pwdMedium: "Medium",
    pwdStrong: "Strong",
    pwdVeryStrong: "Very Strong",
    securityLockedOut: "Account temporarily locked for security. Please wait before trying again.",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  es: {
    language: "Idioma", chooseLanguage: "Elige tu idioma", chooseLanguageHint: "Puedes cambiarlo después en Ajustes.", continue: "Continuar", settings: "Ajustes", yourName: "Tu nombre", monthlyBudget: "Presupuesto mensual (€)", dailyLimit: "Límite diario (€) - opcional", save: "Guardar", cancel: "Cancelar", welcomeBack: "Bienvenido de nuevo", logout: "Cerrar sesión", personalFinanceTracker: "Control de finanzas personales", username: "Usuario", password: "Contraseña", login: "Iniciar sesión", loggingIn: "Iniciando sesión...", enterUsername: "Escribe tu usuario", enterPassword: "Escribe tu contraseña", monthlyBudgetShort: "Presupuesto mensual", spent: "Gastado", income: "Ingresos", remaining: "Restante", addTransaction: "Añadir transacción", transactions: "Transacciones", noTransactions: "Aún no hay transacciones.", addOneToGetStarted: "¡Añade una para empezar!", expense: "Gasto", incomeType: "Ingreso", namePlaceholder: "Nombre (ej. Café)", amountPlaceholder: "Importe (€)", categoryPlaceholder: "Categoría (ej. Comida)", reasonPlaceholder: "Motivo / nota (ej. comida con el equipo)", addTransactionButton: "Añadir transacción", setBudget: "Definir presupuesto", clickSettingsToChange: "Pulsa Ajustes para cambiarlo", used: "Usado", budgetUsed: "del presupuesto usado", current: "Actual", notSet: "Sin definir", leaveBlank: "Déjalo vacío para mantener el presupuesto actual", pleaseFillNameAmount: "Completa el nombre y el importe", areYouSureLogout: "¿Seguro que quieres cerrar sesión?", loading: "Cargando...", brandSub: "Control de finanzas personales", editName: "Pulsa para editar", recentDaily: "Actividad diaria", recentWeekly: "Actividad semanal", recentMonthly: "Actividad mensual", welcome: "Bienvenido de nuevo", email: "Correo electrónico", firstName: "Nombre", lastName: "Apellidos", chooseUsername: "Elige un usuario", enterEmail: "Escribe tu correo", firstNamePlaceholder: "Nombre", lastNamePlaceholder: "Apellidos", minPassword: "Mínimo 8 caracteres", confirmPassword: "Confirma la contraseña", monthlyBudgetOptional: "Presupuesto mensual (€) - opcional", budgetExample: "ej. 1500", register: "Registrarse", registering: "Registrando...", createAccount: "Crear cuenta", appTitle: "Steve Budget", backToLogin: "Volver al inicio de sesión", daily: "Diario", weekly: "Semanal", monthly: "Mensual", noAccount: "¿No tienes una cuenta?", registerHere: "Regístrate aquí",
    changeLanguage: "Cambiar idioma",
    usernameRequired: "El nombre de usuario es obligatorio",
    emailRequired: "El correo electrónico es obligatorio",
    passwordMinLength: "La contraseña debe tener al menos 8 caracteres con mayúscula, minúscula, número y símbolo",
    passwordsDontMatch: "Las contraseñas no coinciden",
    loginSuccessful: "¡Inicio de sesión correcto! Redirigiendo...",
    registerSuccessful: "¡Registro correcto! Redirigiendo al inicio de sesión...",
    registerSuccessfulHome: "¡Cuenta creada con éxito! Bienvenido, entrando al panel...",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    loginHere: "Inicia sesión aquí",
    pwdLength: "8+ caracteres",
    pwdUpper: "1 mayúscula",
    pwdLower: "1 minúscula",
    pwdNumber: "1 número",
    pwdSpecial: "1 símbolo (@$!%*?&#)",
    pwdStrength: "Seguridad de contraseña",
    pwdWeak: "Débil",
    pwdMedium: "Media",
    pwdStrong: "Fuerte",
    pwdVeryStrong: "Muy Fuerte",
    securityLockedOut: "Cuenta bloqueada temporalmente por seguridad. Espere antes de reintentar.",
    showPassword: "Ver contraseña",
    hidePassword: "Ocultar contraseña",
  },
  fr: {
    language: "Langue", chooseLanguage: "Choisissez votre langue", chooseLanguageHint: "Vous pourrez la modifier dans Paramètres.", continue: "Continuer", settings: "Paramètres", yourName: "Votre nom", monthlyBudget: "Budget mensuel (€)", dailyLimit: "Limite quotidienne (€) - facultatif", save: "Enregistrer", cancel: "Annuler", welcomeBack: "Bon retour", logout: "Déconnexion", personalFinanceTracker: "Suivi des finances personnelles", username: "Nom d'utilisateur", password: "Mot de passe", login: "Connexion", loggingIn: "Connexion...", enterUsername: "Saisissez votre nom", enterPassword: "Saisissez votre mot de passe", monthlyBudgetShort: "Budget mensuel", spent: "Dépensé", income: "Revenus", remaining: "Restant", addTransaction: "Ajouter une transaction", transactions: "Transactions", noTransactions: "Aucune transaction pour le moment.", addOneToGetStarted: "Ajoutez-en une pour commencer !", expense: "Dépense", incomeType: "Revenu", namePlaceholder: "Nom (ex. Café)", amountPlaceholder: "Montant (€)", categoryPlaceholder: "Catégorie (ex. Alimentation)", reasonPlaceholder: "Motif / note (ex. déjeuner en équipe)", addTransactionButton: "Ajouter la transaction", setBudget: "Définir le budget", clickSettingsToChange: "Ouvrez Paramètres pour modifier", used: "Utilisé", budgetUsed: "du budget utilisé", current: "Actuel", notSet: "Non défini", leaveBlank: "Laissez vide pour conserver le budget actuel", pleaseFillNameAmount: "Saisissez un nom et un montant", areYouSureLogout: "Voulez-vous vraiment vous déconnecter ?", loading: "Chargement...", brandSub: "Suivi des finances personnelles", editName: "Cliquer pour modifier", recentDaily: "Récent quotidien", recentWeekly: "Récent hebdomadaire", recentMonthly: "Récent mensuel", welcome: "Bon retour", email: "E-mail", firstName: "Prénom", lastName: "Nom", chooseUsername: "Choisissez un nom", enterEmail: "Saisissez votre e-mail", firstNamePlaceholder: "Prénom", lastNamePlaceholder: "Nom", minPassword: "8 caractères minimum", confirmPassword: "Confirmez le mot de passe", monthlyBudgetOptional: "Budget mensuel (€) - facultatif", budgetExample: "ex. 1500", register: "S'inscrire", registering: "Inscription...", createAccount: "Créer un compte", appTitle: "Steve Budget", backToLogin: "Retour à la connexion", daily: "Quotidien", weekly: "Hebdomadaire", monthly: "Mensuel", noAccount: "Vous n'avez pas de compte ?", registerHere: "Inscrivez-vous ici",
    changeLanguage: "Changer de langue",
    usernameRequired: "Le nom d'utilisateur est requis",
    emailRequired: "L'e-mail est requis",
    passwordMinLength: "Le mot de passe doit comporter au moins 8 caractères avec majuscule, minuscule, chiffre et symbole",
    passwordsDontMatch: "Les mots de passe ne correspondent pas",
    loginSuccessful: "Connexion réussie ! Redirection...",
    registerSuccessful: "Inscription réussie ! Redirection vers la connexion...",
    registerSuccessfulHome: "Compte créé avec succès ! Bienvenue, redirection vers le tableau...",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    loginHere: "Connectez-vous ici",
    pwdLength: "8+ caractères",
    pwdUpper: "1 majuscule",
    pwdLower: "1 minuscule",
    pwdNumber: "1 chiffre",
    pwdSpecial: "1 symbole (@$!%*?&#)",
    pwdStrength: "Force du mot de passe",
    pwdWeak: "Faible",
    pwdMedium: "Moyen",
    pwdStrong: "Fort",
    pwdVeryStrong: "Très Fort",
    securityLockedOut: "Compte temporairement verrouillé par sécurité. Veuillez patienter.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
  },
  pt: {
    language: "Idioma", chooseLanguage: "Escolha o seu idioma", chooseLanguageHint: "Pode alterar isto mais tarde em Definições.", continue: "Continuar", settings: "Definições", yourName: "O seu nome", monthlyBudget: "Orçamento mensal (€)", dailyLimit: "Limite diário (€) - opcional", save: "Guardar", cancel: "Cancelar", welcomeBack: "Bem-vindo de volta", logout: "Sair", personalFinanceTracker: "Gestor de finanças pessoais", username: "Nome de utilizador", password: "Palavra-passe", login: "Iniciar sessão", loggingIn: "A iniciar sessão...", enterUsername: "Introduza o nome de utilizador", enterPassword: "Introduza a palavra-passe", monthlyBudgetShort: "Orçamento mensal", spent: "Gasto", income: "Rendimento", remaining: "Restante", addTransaction: "Adicionar transação", transactions: "Transações", noTransactions: "Ainda não existem transações.", addOneToGetStarted: "Adicione uma para começar!", expense: "Despesa", incomeType: "Rendimento", namePlaceholder: "Nome (ex. Café)", amountPlaceholder: "Valor (€)", categoryPlaceholder: "Categoria (ex. Alimentação)", reasonPlaceholder: "Motivo / nota (ex. almoço com a equipa)", addTransactionButton: "Adicionar transação", setBudget: "Definir orçamento", clickSettingsToChange: "Abra Definições para alterar", used: "Usado", budgetUsed: "do orçamento utilizado", current: "Atual", notSet: "Não definido", leaveBlank: "Deixe vazio para manter o orçamento atual", pleaseFillNameAmount: "Preencha o nome e o valor", areYouSureLogout: "Tem a certeza de que quer sair?", loading: "A carregar...", brandSub: "Gestor de finanças pessoais", editName: "Clique para editar", recentDaily: "Recente diário", recentWeekly: "Recente semanal", recentMonthly: "Recente mensal", welcome: "Bem-vindo de volta", email: "E-mail", firstName: "Nome", lastName: "Apelido", chooseUsername: "Escolha um nome", enterEmail: "Introduza o e-mail", firstNamePlaceholder: "Nome", lastNamePlaceholder: "Apelido", minPassword: "Mínimo de 8 caracteres", confirmPassword: "Confirme a palavra-passe", monthlyBudgetOptional: "Orçamento mensal (€) - opcional", budgetExample: "ex. 1500", register: "Registar", registering: "A registar...", createAccount: "Criar conta", appTitle: "Steve Budget", backToLogin: "Voltar ao início de sessão", daily: "Diário", weekly: "Semanal", monthly: "Mensal", noAccount: "Não tem uma conta?", registerHere: "Registe-se aqui",
    changeLanguage: "Alterar idioma",
    usernameRequired: "O nome de utilizador é obrigatório",
    emailRequired: "O e-mail é obrigatório",
    passwordMinLength: "A palavra-passe deve ter pelo menos 8 caracteres com maiúscula, minúscula, número e símbolo",
    passwordsDontMatch: "As palavras-passe não coincidem",
    loginSuccessful: "Sessão iniciada com sucesso! A redirecionar...",
    registerSuccessful: "Registo concluído com sucesso! A redirecionar para o início de sessão...",
    registerSuccessfulHome: "Conta criada com sucesso! Bem-vindo, a entrar no painel principal...",
    alreadyHaveAccount: "Já tem uma conta?",
    loginHere: "Inicie sessão aqui",
    pwdLength: "8+ caracteres",
    pwdUpper: "1 maiúscula",
    pwdLower: "1 minúscula",
    pwdNumber: "1 número",
    pwdSpecial: "1 símbolo (@$!%*?&#)",
    pwdStrength: "Força da palavra-passe",
    pwdWeak: "Fraca",
    pwdMedium: "Média",
    pwdStrong: "Forte",
    pwdVeryStrong: "Muito Forte",
    securityLockedOut: "Conta temporariamente bloqueada por segurança. Aguarde antes de tentar novamente.",
    showPassword: "Ver palavra-passe",
    hidePassword: "Ocultar palavra-passe",
  },
};

const languageOptions = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
];

const extraTranslations = {
  en: {
    total: "Total", totalBudget: "Total budget", transactionName: "Transaction name", submit: "Submit", today: "Today", limit: "limit", dailyBudget: "Daily budget", monthlyBudgetTitle: "Monthly budget", thisMonth: "This month", budgetCap: "Budget cap line", perMonth: "per month", net: "Net", noTransactionsShort: "No transactions yet", edit: "Edit", lightMode: "Light mode", darkMode: "Dark mode",
    dashboard: "Dashboard", analytics: "Analytics", calendar: "Calendar", goals: "Goals", aiCoach: "AI Coach", streak: "Streak", dayStreak: "Day Streak", achievements: "Achievements", badges: "Badges", notifications: "Notifications", scanReceipt: "Scan Receipt", export: "Export",
    savingsGoalsTitle: "Savings Goals", createGoal: "Create Goal", goalNamePlaceholder: "Goal name (e.g., Emergency Fund, Vacation)", targetAmountPlaceholder: "Target amount (€)", targetDate: "Target Date", currentSaved: "Saved", depositFunds: "Add Deposit", depositPlaceholder: "Amount to deposit (€)",
    spendingCalendarTitle: "Spending Heat-Map", underLimit: "Under Limit", nearLimit: "Near Limit (75%+)", overLimit: "Over Limit", noSpend: "No Spending",
    dailySpendingPower: "Safe Daily Allowance", burnRate: "Daily Burn Rate", projectedSpend: "Projected Month-End", likelyToExceed: "You are likely to exceed budget!", recommendations: "AI Financial Insights", askCoach: "Ask Coach",
    receiptScannerTitle: "AI Receipt Scanner", dragDropReceipt: "Upload receipt image or photo", scanningReceipt: "AI scanning & extracting data...", extractedDetails: "Extracted Receipt Data", merchant: "Merchant", addToTransactions: "Add to Transactions",
    exportStatement: "Export Statement", downloadCSV: "Download CSV Spreadsheet", printStatement: "Print / Save PDF Report", emptyGoals: "No savings goals yet. Create one to start saving!", markAllRead: "Mark all as read", categoryBreakdown: "Category Breakdown",
    detectedCategory: "Detected Category", autoCategorizedAs: "Auto-categorized as", tapToApply: "Click to select", selectCategory: "Select category", dailyBarChartTitle: "Daily Spending (Last 7 Days)", safeAllowance: "Safe Allowance",
    catShopping: "Shopping", catVehicle: "Vehicle", catTransportation: "Transportation", catInvestment: "Investment", catOnPlan: "On Plan Expenses", catUnplanned: "Unplanned Expenses", catFood: "Food & Dining", catEntertainment: "Entertainment", catHealth: "Health & Medical", catIncome: "Salary & Income", catGeneral: "General",
    prevMonth: "Previous Month", nextMonth: "Next Month", exitCalendar: "Exit to Dashboard", allTransactions: "All", expensesTab: "Expenses", incomeTab: "Income", incomeOverview: "Income Records & Money Received", totalIncomeReceived: "Total Income Received", depositsCount: "Deposits Recorded", avgIncome: "Average Deposit", highestIncome: "Highest Deposit", noIncomeYet: "No income recorded yet. Log your paycheck or deposits!", noExpensesYet: "No expenses recorded yet.",
    monthlyComparison: "Monthly Comparison", compareMonths: "Compare Months", compareMonthsSub: "Track monthly expenses, compare spending across months, and maintain your budget.", highestSpendMonth: "Peak Spending Month", lowestSpendMonth: "Most Frugal Month", avgMonthlySpend: "Average Monthly Spend", budgetHealth: "Budget Health", budgetMaintenanceTitle: "Smart Budget Maintenance & Advisor", budgetMaintenanceSub: "Historical baselines & recommendations to keep your finances balanced.", applyRecommendedBudget: "Apply Recommended Budget", budgetAppliedSuccess: "Successfully updated your monthly budget and daily limit!", currentBudget: "Current Budget", recommendedBudget: "Recommended Target", safeDailyPace: "Safe Daily Pace", monthByMonthChart: "Month-by-Month Spending vs Budget", chartClickHint: "Tap on any month column to inspect category breakdowns.", monthlyComparisonTable: "All Months Spending Summary", month: "Month", vsPriorMonth: "vs Prior Month", grade: "Health Grade", breakdown: "Breakdown", yesterday: "Yesterday",
    tierExcellent: "Excellent",
    tierGood: "Good",
    tierAverage: "Average",
    tierPoor: "Poor",
    tierNoSpend: "No Spend",
    monthEndReport: "End of Month Report",
    performanceRating: "Performance Rating",
    starRating: "Star Rating",
    starsEarned: "Stars Earned",
    starsAndPerformance: "Rating & Stars",
    endOfMonthVerdict: "End of Month Performance Review",
    profilePhoto: "Profile Photo",
    changePhoto: "Change Photo",
    uploadPhoto: "Upload Photo",
    removePhoto: "Remove Photo",
    personalAccount: "Personal Account",
    dailyLimitExceededTitle: "Daily Limit Exceeded! 🚨",
    dailyLimitNearTitle: "Approaching Daily Limit ⚠️",
    antiOverspendingAdviceTitle: "💡 Advice to Stop Overspending",
    advicePausePurchases: "Hold off on all discretionary and non-essential spending for the rest of today.",
    adviceCookAtHome: "Prepare meals or coffee at home today instead of ordering takeout or dining out.",
    adviceCheckAllowance: "Check your safe daily pace in AI Coach to protect your end-of-month savings.",
    dailyBannerWarning: "Daily limit exceeded! You've spent €{spent} today (€{over} over €{limit} limit).",
    viewAdvice: "View Advice",
    dismiss: "Dismiss",
    clearAll: "Clear All",
    delete: "Delete",
    noNotifications: "You're all caught up! No notifications."
  },
  es: {
    total: "Total", totalBudget: "Presupuesto total", transactionName: "Nombre de la transacción", submit: "Enviar", today: "Hoy", limit: "límite", dailyBudget: "Presupuesto diario", monthlyBudgetTitle: "Presupuesto mensual", thisMonth: "Este mes", budgetCap: "Límite del presupuesto", perMonth: "al mes", net: "Neto", noTransactionsShort: "Aún no hay transacciones", edit: "Editar", lightMode: "Modo claro", darkMode: "Modo oscuro",
    dashboard: "Panel", analytics: "Análisis", calendar: "Calendario", goals: "Metas", aiCoach: "Asesor IA", streak: "Racha", dayStreak: "Días de racha", achievements: "Logros", badges: "Medallas", notifications: "Notificaciones", scanReceipt: "Escanear recibo", export: "Exportar",
    savingsGoalsTitle: "Metas de Ahorro", createGoal: "Crear Meta", goalNamePlaceholder: "Nombre de la meta (ej. Fondo de emergencia)", targetAmountPlaceholder: "Importe objetivo (€)", targetDate: "Fecha límite", currentSaved: "Ahorrado", depositFunds: "Añadir dinero", depositPlaceholder: "Cantidad a ingresar (€)",
    spendingCalendarTitle: "Mapa de Gastos Diario", underLimit: "Bajo control", nearLimit: "Cerca del límite (75%+)", overLimit: "Límite superado", noSpend: "Sin gastos",
    dailySpendingPower: "Gasto diario seguro", burnRate: "Gasto medio diario", projectedSpend: "Proyección a fin de mes", likelyToExceed: "¡Alerta: riesgo de superar el presupuesto!", recommendations: "Consejos Inteligentes de la IA", askCoach: "Preguntar al Asesor",
    receiptScannerTitle: "Escáner de Recibos IA", dragDropReceipt: "Sube una foto o imagen de tu recibo", scanningReceipt: "La IA está analizando el recibo...", extractedDetails: "Datos extraídos del recibo", merchant: "Establecimiento", addToTransactions: "Añadir a transacciones",
    exportStatement: "Exportar Extracto", downloadCSV: "Descargar archivo CSV", printStatement: "Imprimir / Guardar PDF", emptyGoals: "¡Aún no tienes metas de ahorro! Crea una para empezar.", markAllRead: "Marcar todo como leído", categoryBreakdown: "Desglose por categorías",
    detectedCategory: "Categoría detectada", autoCategorizedAs: "Categorizado automáticamente como", tapToApply: "Haz clic para seleccionar", selectCategory: "Seleccionar categoría", dailyBarChartTitle: "Gasto Diario (Últimos 7 Días)", safeAllowance: "Margen Seguro",
    catShopping: "Compras", catVehicle: "Vehículo", catTransportation: "Transporte", catInvestment: "Inversión", catOnPlan: "Gastos Planificados", catUnplanned: "Gastos Imprevistos", catFood: "Comida y Restaurantes", catEntertainment: "Entretenimiento", catHealth: "Salud y Medicina", catIncome: "Salario e Ingresos", catGeneral: "General",
    prevMonth: "Mes anterior", nextMonth: "Mes siguiente", exitCalendar: "Volver al panel", allTransactions: "Todas", expensesTab: "Gastos", incomeTab: "Ingresos", incomeOverview: "Registro de Ingresos y Dinero Recibido", totalIncomeReceived: "Total Ingresos Recibidos", depositsCount: "Depósitos Registrados", avgIncome: "Ingreso Medio", highestIncome: "Mayor Ingreso", noIncomeYet: "¡Aún no hay ingresos registrados! Registra tu nómina o depósitos.", noExpensesYet: "Aún no hay gastos registrados.",
    monthlyComparison: "Comparación Mensual", compareMonths: "Comparar Meses", compareMonthsSub: "Controla tus gastos mensuales, compáralos mes a mes y mantén un presupuesto saludable.", highestSpendMonth: "Mes con mayor gasto", lowestSpendMonth: "Mes más ahorrador", avgMonthlySpend: "Gasto medio mensual", budgetHealth: "Salud del presupuesto", budgetMaintenanceTitle: "Mantenimiento y Asesor de Presupuesto", budgetMaintenanceSub: "Líneas de base históricas y consejos para equilibrar tus finanzas.", applyRecommendedBudget: "Aplicar Presupuesto Recomendado", budgetAppliedSuccess: "¡Presupuesto mensual y límite diario actualizados con éxito!", currentBudget: "Presupuesto actual", recommendedBudget: "Objetivo recomendado", safeDailyPace: "Ritmo diario seguro", monthByMonthChart: "Gasto mensual vs Presupuesto", chartClickHint: "Toca cualquier mes para ver el desglose por categorías.", monthlyComparisonTable: "Resumen de gastos de todos los meses", month: "Mes", vsPriorMonth: "vs Mes anterior", grade: "Calificación", breakdown: "Desglose", yesterday: "Ayer",
    tierExcellent: "Excelente",
    tierGood: "Bueno",
    tierAverage: "Promedio",
    tierPoor: "Deficiente",
    tierNoSpend: "Sin gastos",
    monthEndReport: "Informe de Fin de Mes",
    performanceRating: "Evaluación de Rendimiento",
    starRating: "Calificación por Estrellas",
    starsEarned: "Estrellas Obtenidas",
    starsAndPerformance: "Calificación y Estrellas",
    endOfMonthVerdict: "Revisión de Fin de Mes",
    profilePhoto: "Foto de Perfil",
    changePhoto: "Cambiar Foto",
    uploadPhoto: "Subir Foto",
    removePhoto: "Eliminar Foto",
    personalAccount: "Cuenta Personal",
    dailyLimitExceededTitle: "¡Límite Diario Superado! 🚨",
    dailyLimitNearTitle: "Cerca del Límite Diario ⚠️",
    antiOverspendingAdviceTitle: "💡 Consejos para Frenar el Gasto",
    advicePausePurchases: "Detén todas las compras prescindibles e impulsivas por el resto del día.",
    adviceCookAtHome: "Prepara tus comidas y café en casa hoy en lugar de comer fuera o pedir a domicilio.",
    adviceCheckAllowance: "Consulta el margen seguro en tu Asesor IA para proteger tus ahorros del mes.",
    dailyBannerWarning: "¡Límite diario superado! Has gastado €{spent} hoy (€{over} por encima de €{limit}).",
    viewAdvice: "Ver Consejos",
    dismiss: "Descartar",
    clearAll: "Borrar Todo",
    delete: "Eliminar",
    noNotifications: "¡Todo al día! No tienes notificaciones."
  },
  fr: {
    total: "Total", totalBudget: "Budget total", transactionName: "Nom de la transaction", submit: "Envoyer", today: "Aujourd'hui", limit: "limite", dailyBudget: "Budget quotidien", monthlyBudgetTitle: "Budget mensuel", thisMonth: "Ce mois-ci", budgetCap: "Plafond du budget", perMonth: "par mois", net: "Net", noTransactionsShort: "Aucune transaction pour le moment", edit: "Modifier", lightMode: "Mode clair", darkMode: "Mode sombre",
    dashboard: "Tableau", analytics: "Statistiques", calendar: "Calendrier", goals: "Objectifs", aiCoach: "Coach IA", streak: "Série", dayStreak: "Jours d'affilée", achievements: "Succès", badges: "Badges", notifications: "Notifications", scanReceipt: "Scanner reçu", export: "Exporter",
    savingsGoalsTitle: "Objectifs d'Épargne", createGoal: "Créer un Objectif", goalNamePlaceholder: "Nom de l'objectif (ex. Voyage, Urgence)", targetAmountPlaceholder: "Montant cible (€)", targetDate: "Date cible", currentSaved: "Épargné", depositFunds: "Ajouter des fonds", depositPlaceholder: "Montant à déposer (€)",
    spendingCalendarTitle: "Calendrier des Dépenses", underLimit: "Sous la limite", nearLimit: "Proche de la limite (75%+)", overLimit: "Limite dépassée", noSpend: "Aucune dépense",
    dailySpendingPower: "Allocation journalière sûre", burnRate: "Dépense moyenne / jour", projectedSpend: "Prévision fin de mois", likelyToExceed: "Alerte : risque de dépassement de budget !", recommendations: "Conseils et Analyses IA", askCoach: "Demander au Coach",
    receiptScannerTitle: "Scanner de Reçus IA", dragDropReceipt: "Importez une photo de votre reçu", scanningReceipt: "Analyse et extraction IA en cours...", extractedDetails: "Données extraites du reçu", merchant: "Commerce", addToTransactions: "Ajouter aux transactions",
    exportStatement: "Exporter le Relevé", downloadCSV: "Télécharger le tableur CSV", printStatement: "Imprimer / Sauvegarder PDF", emptyGoals: "Aucun objectif d'épargne. Créez-en un pour commencer !", markAllRead: "Tout marquer comme lu", categoryBreakdown: "Répartition par catégorie",
    detectedCategory: "Catégorie détectée", autoCategorizedAs: "Catégorisé automatiquement en", tapToApply: "Cliquer pour choisir", selectCategory: "Sélectionner la catégorie", dailyBarChartTitle: "Dépenses Journalières (7 derniers jours)", safeAllowance: "Marge Sûre",
    catShopping: "Shopping", catVehicle: "Véhicule", catTransportation: "Transports", catInvestment: "Investissement", catOnPlan: "Dépenses Prévues", catUnplanned: "Dépenses Imprévues", catFood: "Restauration & Courses", catEntertainment: "Divertissement", catHealth: "Santé & Soins", catIncome: "Salaire & Revenus", catGeneral: "Général",
    prevMonth: "Mois précédent", nextMonth: "Mois suivant", exitCalendar: "Retour au tableau", allTransactions: "Toutes", expensesTab: "Dépenses", incomeTab: "Revenus", incomeOverview: "Historique des Revenus & Argent Reçu", totalIncomeReceived: "Total des Revenus Reçus", depositsCount: "Versements Enregistrés", avgIncome: "Revenu Moyen", highestIncome: "Plus Grand Revenu", noIncomeYet: "Aucun revenu enregistré. Ajoutez votre salaire ou virement !", noExpensesYet: "Aucune dépense enregistrée.",
    monthlyComparison: "Comparaison Mensuelle", compareMonths: "Comparer les Mois", compareMonthsSub: "Suivez vos dépenses mensuelles, comparez d'un mois à l'autre et maintenez votre budget.", highestSpendMonth: "Mois le plus dépensier", lowestSpendMonth: "Mois le plus économe", avgMonthlySpend: "Dépense mensuelle moyenne", budgetHealth: "Santé du budget", budgetMaintenanceTitle: "Maintenance et Conseils de Budget", budgetMaintenanceSub: "Repères historiques et conseils pour équilibrer vos finances.", applyRecommendedBudget: "Appliquer le Budget Recommandé", budgetAppliedSuccess: "Budget mensuel et limite quotidienne mis à jour avec succès !", currentBudget: "Budget actuel", recommendedBudget: "Cible recommandée", safeDailyPace: "Rythme quotidien sûr", monthByMonthChart: "Dépenses mensuelles vs Budget", chartClickHint: "Touchez un mois pour voir la répartition par catégorie.", monthlyComparisonTable: "Synthèse des dépenses de tous les mois", month: "Mois", vsPriorMonth: "vs Mois précédent", grade: "Note de santé", breakdown: "Détails", yesterday: "Hier",
    tierExcellent: "Excellent",
    tierGood: "Bon",
    tierAverage: "Moyen",
    tierPoor: "Faible",
    tierNoSpend: "Aucune dépense",
    monthEndReport: "Bilan de Fin de Mois",
    performanceRating: "Évaluation des Performances",
    starRating: "Note par Étoiles",
    starsEarned: "Étoiles Obtenues",
    starsAndPerformance: "Note et Étoiles",
    endOfMonthVerdict: "Bilan de Fin de Mois",
    profilePhoto: "Photo de Profil",
    changePhoto: "Changer la Photo",
    uploadPhoto: "Importer une Photo",
    removePhoto: "Supprimer la Photo",
    personalAccount: "Compte Personnel",
    dailyLimitExceededTitle: "Limite Quotidienne Dépassée ! 🚨",
    dailyLimitNearTitle: "Proche de la Limite Quotidienne ⚠️",
    antiOverspendingAdviceTitle: "💡 Conseils pour Éviter les Dépenses",
    advicePausePurchases: "Mettez en pause tous les achats impulsifs et non essentiels pour le reste de la journée.",
    adviceCookAtHome: "Cuisinez à la maison et évitez les commandes ou restaurants pour aujourd'hui.",
    adviceCheckAllowance: "Consultez le rythme quotidien sûr dans le Coach IA pour préserver votre épargne.",
    dailyBannerWarning: "Limite quotidienne dépassée ! Vous avez dépensé €{spent} aujourd'hui (€{over} au-dessus de €{limit}).",
    viewAdvice: "Voir Conseils",
    dismiss: "Ignorer",
    clearAll: "Tout Effacer",
    delete: "Supprimer",
    noNotifications: "Vous êtes à jour ! Aucune notification."
  },
  pt: {
    total: "Total", totalBudget: "Orçamento total", transactionName: "Nome da transação", submit: "Enviar", today: "Hoje", limit: "limite", dailyBudget: "Orçamento diário", monthlyBudgetTitle: "Orçamento mensal", thisMonth: "Este mês", budgetCap: "Limite do orçamento", perMonth: "por mês", net: "Líquido", noTransactionsShort: "Ainda não existem transações", edit: "Editar", lightMode: "Modo claro", darkMode: "Modo escuro",
    dashboard: "Painel", analytics: "Análise", calendar: "Calendário", goals: "Objetivos", aiCoach: "Treinador IA", streak: "Sequência", dayStreak: "Dias seguidos", achievements: "Conquistas", badges: "Medalhas", notifications: "Notificações", scanReceipt: "Digitalizar recibo", export: "Exportar",
    savingsGoalsTitle: "Objetivos de Poupança", createGoal: "Criar Objetivo", goalNamePlaceholder: "Nome do objetivo (ex. Férias, Emergência)", targetAmountPlaceholder: "Valor pretendido (€)", targetDate: "Data limite", currentSaved: "Poupado", depositFunds: "Adicionar fundos", depositPlaceholder: "Valor a depositar (€)",
    spendingCalendarTitle: "Calendário de Gastos", underLimit: "Abaixo do limite", nearLimit: "Perto do limite (75%+)", overLimit: "Limite excedido", noSpend: "Sem gastos",
    dailySpendingPower: "Margem diária segura", burnRate: "Gasto médio diário", projectedSpend: "Previsão fim de mês", likelyToExceed: "Alerta: risco de ultrapassar o orçamento!", recommendations: "Conselhos Inteligentes IA", askCoach: "Perguntar ao Treinador",
    receiptScannerTitle: "Digitalizador de Recibos IA", dragDropReceipt: "Carregue a foto do seu recibo", scanningReceipt: "IA a analisar e extrair dados...", extractedDetails: "Dados extraídos do recibo", merchant: "Estabelecimento", addToTransactions: "Adicionar às transações",
    exportStatement: "Exportar Extrato", downloadCSV: "Descarregar folha CSV", printStatement: "Imprimir / Guardar PDF", emptyGoals: "Ainda não tem objetivos de poupança. Crie um para começar!", markAllRead: "Marcar tudo como lido", categoryBreakdown: "Repartição por categorias",
    detectedCategory: "Categoria detetada", autoCategorizedAs: "Categorizado automaticamente como", tapToApply: "Clique para selecionar", selectCategory: "Selecionar categoria", dailyBarChartTitle: "Gastos Diários (Últimos 7 Dias)", safeAllowance: "Margem Segura",
    catShopping: "Compras", catVehicle: "Veículo", catTransportation: "Transportes", catInvestment: "Investimentos", catOnPlan: "Despesas Planeadas", catUnplanned: "Despesas Imprevistas", catFood: "Alimentação & Refeições", catEntertainment: "Entretenimento", catHealth: "Saúde & Farmácia", catIncome: "Salário & Rendimentos", catGeneral: "Geral",
    prevMonth: "Mês anterior", nextMonth: "Mês seguinte", exitCalendar: "Voltar ao painel", allTransactions: "Todas", expensesTab: "Despesas", incomeTab: "Rendimentos", incomeOverview: "Registo de Rendimentos e Dinheiro Recebido", totalIncomeReceived: "Total de Rendimentos Recebidos", depositsCount: "Depósitos Registados", avgIncome: "Rendimento Médio", highestIncome: "Maior Rendimento", noIncomeYet: "Ainda não existem rendimentos registados. Registe o seu salário ou depósitos!", noExpensesYet: "Ainda não existem despesas registadas.",
    monthlyComparison: "Comparação Mensual", compareMonths: "Comparar Meses", compareMonthsSub: "Acompanhe as suas despesas mensais, compare os meses e mantenha o seu orçamento equilibrado.", highestSpendMonth: "Mês com maior gasto", lowestSpendMonth: "Mês mais económico", avgMonthlySpend: "Despesa média mensal", budgetHealth: "Saúde do orçamento", budgetMaintenanceTitle: "Manutenção e Consultor de Orçamento", budgetMaintenanceSub: "Linhas de base históricas e conselhos para equilibrar as suas finanças.", applyRecommendedBudget: "Aplicar Orçamento Recomendado", budgetAppliedSuccess: "Orçamento mensal e limite diário atualizados com sucesso!", currentBudget: "Orçamento atual", recommendedBudget: "Meta recomendada", safeDailyPace: "Ritmo diário seguro", monthByMonthChart: "Despesas mensais vs Orçamento", chartClickHint: "Toque num mês para ver o detalhe por categoria.", monthlyComparisonTable: "Resumo de despesas de todos os meses", month: "Mês", vsPriorMonth: "vs Mês anterior", grade: "Classificação", breakdown: "Detalhe", yesterday: "Ontem",
    tierExcellent: "Excelente",
    tierGood: "Bom",
    tierAverage: "Médio",
    tierPoor: "Fraco",
    tierNoSpend: "Sem gastos",
    monthEndReport: "Relatório de Fim de Mês",
    performanceRating: "Avaliação de Desempenho",
    starRating: "Classificação por Estrelas",
    starsEarned: "Estrelas Obtidas",
    starsAndPerformance: "Classificação e Estrelas",
    endOfMonthVerdict: "Balanço de Fim de Mês",
    profilePhoto: "Foto de Perfil",
    changePhoto: "Alterar Foto",
    uploadPhoto: "Carregar Foto",
    removePhoto: "Remover Foto",
    personalAccount: "Conta Pessoal",
    dailyLimitExceededTitle: "Limite Diário Excedido! 🚨",
    dailyLimitNearTitle: "Perto do Limite Diário ⚠️",
    antiOverspendingAdviceTitle: "💡 Conselhos para Evitar Gastos",
    advicePausePurchases: "Faça uma pausa em todas as compras não essenciais e por impulso durante o resto do dia.",
    adviceCookAtHome: "Cozinhe em casa e evite refeições fora ou entregas de comida hoje.",
    adviceCheckAllowance: "Verifique a margem diária no Treinador IA para proteger as suas poupanças do mês.",
    dailyBannerWarning: "Limite diário excedido! Gastou €{spent} hoje (€{over} acima do limite de €{limit}).",
    viewAdvice: "Ver Conselhos",
    dismiss: "Fechar",
    clearAll: "Limpar Tudo",
    delete: "Eliminar",
    noNotifications: "Está tudo em dia! Sem notificações."
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem("budgetLanguage") || "en");
  const [showLanguagePicker, setShowLanguagePicker] = useState(() => !localStorage.getItem("budgetLanguage"));

  const setLanguage = (nextLanguage) => {
    if (!translations[nextLanguage]) return;
    setLanguageState(nextLanguage);
    localStorage.setItem("budgetLanguage", nextLanguage);
  };

  const t = (key) => translations[language][key] || extraTranslations[language][key] || translations.en[key] || extraTranslations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageOptions, showLanguagePicker, setShowLanguagePicker }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguagePicker({ forceOpen = false }) {
  const { language, setLanguage, t, languageOptions, showLanguagePicker, setShowLanguagePicker } = useLanguage();
  const isOpen = forceOpen || showLanguagePicker;
  if (!isOpen) return null;

  const choose = (code) => {
    setLanguage(code);
    if (!forceOpen) setShowLanguagePicker(false);
  };

  return (
    <div className="language-picker-backdrop" role="dialog" aria-modal="true" aria-labelledby="language-picker-title">
      <div className="language-picker">
        <div className="language-picker-mark">文</div>
        <p className="language-picker-eyebrow">STEVE BUDGET</p>
        <h2 id="language-picker-title">{t("chooseLanguage")}</h2>
        <p className="language-picker-hint">{t("chooseLanguageHint")}</p>
        <div className="language-options">
          {languageOptions.map((option) => (
            <button key={option.code} type="button" className={`language-option ${language === option.code ? "language-option--selected" : ""}`} onClick={() => choose(option.code)}>
              <span>{option.label}</span>
              <span aria-hidden="true">{language === option.code ? "✓" : "→"}</span>
            </button>
          ))}
        </div>
        <button type="button" className="language-continue" onClick={() => { setShowLanguagePicker(false); localStorage.setItem("budgetLanguage", language); }}>
          {t("continue")} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
