// The backend has no endpoint that lists the chart of accounts. These are the
// seed rows from village-bank-core/src/VillageBank.Api/Data/BankDbContext.cs
// (Account HasData, ids 1-7). If accounts are added there, update this list or
// add a GET endpoint and replace it.

export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export type Account = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
};

export const CHART_OF_ACCOUNTS: readonly Account[] = [
  { id: 1, code: "1000", name: "Cash", type: "Asset" },
  { id: 2, code: "1200", name: "Loans Receivable", type: "Asset" },
  { id: 3, code: "2000", name: "Member Savings", type: "Liability" },
  { id: 4, code: "3000", name: "Share Capital", type: "Equity" },
  { id: 5, code: "4000", name: "Interest Income", type: "Income" },
  { id: 6, code: "4100", name: "Penalty Income", type: "Income" },
  { id: 7, code: "5000", name: "Interest Expense on Savings", type: "Expense" },
];
