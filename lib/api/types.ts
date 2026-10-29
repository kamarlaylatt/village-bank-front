// Mirrors village-bank-core/src/VillageBank.Api/Contracts/*.cs and
// Controllers/JournalEntriesController.cs. Only fields that exist in those
// C# records are listed. JSON is camelCase, enums are strings, DateOnly is
// "YYYY-MM-DD" and DateTime is a UTC ISO 8601 string.

export const ROLES = ["SuperAdmin", "Manager", "Teller", "Auditor"] as const;
export type Role = (typeof ROLES)[number];

// --- Auth (Contracts/AuthContracts.cs) ---------------------------------

export type LoginRequest = { username: string; password: string };

export type LoginResponse = {
  accessToken: string;
  expiresAt: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// --- Users (Contracts/UserContracts.cs) --------------------------------

export type UserDetails = {
  id: number;
  username: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type CreateUserRequest = {
  username: string;
  role: Role;
  temporaryPassword: string;
};

export type ChangeRoleRequest = { role: Role };

export type ResetPasswordRequest = { temporaryPassword: string };

// --- Members (Contracts/MemberContracts.cs) ----------------------------

export type MemberDetails = {
  id: number;
  fullName: string;
  phone: string | null;
  village: string | null;
  joinedOn: string;
  isActive: boolean;
  savingsAccountId: number;
  savingsBalance: number;
};

export type CreateMemberRequest = {
  fullName: string;
  phone?: string | null;
  village?: string | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// --- Savings (Contracts/SavingsContracts.cs) ---------------------------

// `type` is a plain string in the C# records, populated from
// SavingsTransactionType.ToString() in Services/SavingsService.cs.
export type SavingsTransactionType = "Deposit" | "Withdrawal";

export type SavingsAccountSummary = {
  id: number;
  memberId: number;
  memberName: string;
  balance: number;
  isActive: boolean;
};

export type StatementLine = {
  transactionId: number;
  type: SavingsTransactionType;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export type SavingsTransactionResult = {
  transactionId: number;
  savingsAccountId: number;
  type: SavingsTransactionType;
  amount: number;
  balanceAfter: number;
  journalEntryId: number;
  createdAt: string;
  replayed: boolean;
};

export type MoneyRequest = { amount: number; note?: string | null };

// --- Journal (Controllers/JournalEntriesController.cs, Domain/LineInput.cs)

export type JournalLineInput = {
  accountId: number;
  debit: number;
  credit: number;
};

export type PostJournalEntryRequest = {
  entryDate: string;
  description: string;
  lines: JournalLineInput[];
};

export type PostJournalEntryResponse = { id: number };

// --- Loans (Contracts/LoanContracts.cs, Domain/LoanStatus.cs) ----------
// Amounts are whole kip. Enums are strings; DateOnly is "YYYY-MM-DD".

export const LOAN_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Active",
  "Closed",
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export type LoanPreviewRequest = {
  principal: number;
  monthlyInterestRatePercent: number;
  termMonths: number;
};

export type ApplyLoanRequest = LoanPreviewRequest & {
  memberId: number;
  purpose?: string | null;
};

export type RejectLoanRequest = { reason: string };

export type RepayLoanRequest = { amount: number; note?: string | null };

export type InstallmentPreview = {
  number: number;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
};

export type LoanPreview = {
  principal: number;
  totalInterest: number;
  totalRepayable: number;
  installments: InstallmentPreview[];
};

export type InstallmentDetails = {
  number: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  principalPaid: number;
  interestPaid: number;
  isPaid: boolean;
};

export type LoanDetails = {
  id: number;
  memberId: number;
  memberName: string;
  principal: number;
  monthlyInterestRatePercent: number;
  termMonths: number;
  purpose: string | null;
  status: LoanStatus;
  appliedAt: string;
  decidedAt: string | null;
  rejectionReason: string | null;
  disbursedOn: string | null;
  totalInterest: number;
  totalPaid: number;
  outstanding: number;
  overdueAmount: number;
  daysPastDue: number;
  installments: InstallmentDetails[];
  // Usernames of the staff who acted; null when that step has not happened yet.
  appliedBy: string | null;
  decidedBy: string | null;
  disbursedBy: string | null;
};

export type LoanSummary = {
  id: number;
  memberId: number;
  memberName: string;
  principal: number;
  status: LoanStatus;
  appliedAt: string;
  disbursedOn: string | null;
};

export type RepaymentResult = {
  repaymentId: number;
  loanId: number;
  amount: number;
  principalPart: number;
  interestPart: number;
  outstanding: number;
  loanStatus: LoanStatus;
  journalEntryId: number;
  createdAt: string;
  replayed: boolean;
};

// --- Reports (Contracts/ReportContracts.cs) -----------------------------

export type TrialBalanceLine = {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

export type TrialBalanceReport = {
  asOf: string;
  lines: TrialBalanceLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
};

export type BalanceSheetLine = { code: string; name: string; amount: number };

export type BalanceSheetReport = {
  asOf: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  earningsToDate: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
};

export type IncomeStatementLine = { code: string; name: string; amount: number };

export type IncomeStatementReport = {
  from: string;
  to: string;
  income: IncomeStatementLine[];
  expenses: IncomeStatementLine[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

export type CashBookLine = {
  entryId: number;
  createdAt: string;
  description: string;
  createdBy: string | null;
  receipt: number;
  payment: number;
  balance: number;
};

export type CashBookReport = {
  date: string;
  openingBalance: number;
  lines: CashBookLine[];
  totalReceipts: number;
  totalPayments: number;
  closingBalance: number;
};

export type AgingBucket = {
  label: string;
  loans: number;
  principalOutstanding: number;
  overdueAmount: number;
};

export type OverdueLoan = {
  loanId: number;
  memberId: number;
  memberName: string;
  principalOutstanding: number;
  overdueAmount: number;
  daysPastDue: number;
};

export type PortfolioAtRisk = {
  name: string;
  moreThanDaysPastDue: number;
  principalAtRisk: number;
  percent: number;
};

export type LoanAgingReport = {
  asOf: string;
  activeLoans: number;
  totalPrincipalOutstanding: number;
  buckets: AgingBucket[];
  portfolioAtRisk: PortfolioAtRisk[];
  overdueLoans: OverdueLoan[];
};

export type ReconciliationCheck = {
  name: string;
  description: string;
  expected: number;
  actual: number;
  difference: number;
  isOk: boolean;
};

export type ReconciliationReport = {
  generatedAt: string;
  checks: ReconciliationCheck[];
  allOk: boolean;
};
