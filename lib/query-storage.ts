export interface SavedQuery {
  id: string
  name: string
  sql: string
  description?: string
  createdAt: number
  lastRun?: number
  tags?: string[]
}

export interface QueryHistory {
  id: string
  sql: string
  executedAt: number
  rowCount?: number
  executionTime?: number
  error?: string
}

const SAVED_QUERIES_KEY = "duckdb-saved-queries"
const QUERY_HISTORY_KEY = "duckdb-query-history"
const MAX_HISTORY_ITEMS = 50

export const queryStorage = {
  // Saved Queries
  getSavedQueries(): SavedQuery[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(SAVED_QUERIES_KEY)
    return data ? JSON.parse(data) : []
  },

  saveQuery(query: Omit<SavedQuery, "id" | "createdAt">): SavedQuery {
    const queries = this.getSavedQueries()
    const newQuery: SavedQuery = {
      ...query,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    queries.push(newQuery)
    localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries))
    return newQuery
  },

  updateQuery(id: string, updates: Partial<SavedQuery>): void {
    const queries = this.getSavedQueries()
    const index = queries.findIndex((q) => q.id === id)
    if (index !== -1) {
      queries[index] = { ...queries[index], ...updates }
      localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries))
    }
  },

  deleteQuery(id: string): void {
    const queries = this.getSavedQueries().filter((q) => q.id !== id)
    localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries))
  },

  // Query History
  getQueryHistory(): QueryHistory[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(QUERY_HISTORY_KEY)
    return data ? JSON.parse(data) : []
  },

  addToHistory(entry: Omit<QueryHistory, "id" | "executedAt">): void {
    const history = this.getQueryHistory()
    const newEntry: QueryHistory = {
      ...entry,
      id: crypto.randomUUID(),
      executedAt: Date.now(),
    }
    history.unshift(newEntry)

    // Keep only the last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(trimmedHistory))
  },

  clearHistory(): void {
    localStorage.removeItem(QUERY_HISTORY_KEY)
  },
}

// Query Templates
export const queryTemplates: SavedQuery[] = [
  {
    id: "template-1",
    name: "Select All",
    sql: "SELECT * FROM parquet_data LIMIT 100",
    description: "View first 100 rows",
    createdAt: Date.now(),
    tags: ["basic"],
  },
  {
    id: "template-2",
    name: "Count Rows",
    sql: "SELECT COUNT(*) as total_rows FROM parquet_data",
    description: "Count total rows in dataset",
    createdAt: Date.now(),
    tags: ["basic", "aggregation"],
  },
  {
    id: "template-3",
    name: "Column Summary",
    sql: `SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT column_name) as unique_values,
  COUNT(column_name) as non_null_count
FROM parquet_data`,
    description: "Get summary statistics for a column",
    createdAt: Date.now(),
    tags: ["analysis"],
  },
  {
    id: "template-4",
    name: "Group By Aggregation",
    sql: `SELECT 
  column_name,
  COUNT(*) as count,
  AVG(numeric_column) as avg_value
FROM parquet_data
GROUP BY column_name
ORDER BY count DESC
LIMIT 10`,
    description: "Group and aggregate data",
    createdAt: Date.now(),
    tags: ["aggregation", "grouping"],
  },
  {
    id: "template-5",
    name: "Date Range Filter",
    sql: `SELECT * FROM parquet_data
WHERE date_column BETWEEN '2024-01-01' AND '2024-12-31'
LIMIT 100`,
    description: "Filter by date range",
    createdAt: Date.now(),
    tags: ["filter", "date"],
  },
]
