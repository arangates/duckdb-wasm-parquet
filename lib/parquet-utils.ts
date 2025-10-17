// Utility functions for processing Parquet data (NYC Taxi dataset)

import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export interface TaxiRecord {
  VendorID?: number
  tpep_pickup_datetime?: string
  tpep_dropoff_datetime?: string
  passenger_count?: number
  trip_distance?: number
  pickup_longitude?: number
  pickup_latitude?: number
  RatecodeID?: number
  store_and_fwd_flag?: string
  dropoff_longitude?: number
  dropoff_latitude?: number
  payment_type?: number
  fare_amount?: number
  extra?: number
  mta_tax?: number
  tip_amount?: number
  tolls_amount?: number
  improvement_surcharge?: number
  total_amount?: number
  [key: string]: any
}

export interface DataStats {
  totalRecords: number
  totalRevenue: number
  averageFare: number
  averageDistance: number
  averagePassengers: number
  totalTrips: number
  revenueChange: number
  tripsChange: number
}

export interface TrendData {
  date: string
  trips: number
  revenue: number
  avgFare: number
}

// Calculate statistics from the dataset
export async function calculateStatsFromDB(connection: AsyncDuckDBConnection): Promise<DataStats> {
  try {
    // Get basic statistics with a single SQL query
    const statsQuery = `
      SELECT 
        COUNT(*) as totalRecords,
        SUM(COALESCE(total_amount, fare_amount, 0)) as totalRevenue,
        AVG(COALESCE(total_amount, fare_amount, 0)) as averageFare,
        AVG(COALESCE(trip_distance, 0)) as averageDistance,
        AVG(COALESCE(passenger_count, 0)) as averagePassengers
      FROM taxi_data
    `

    const result = await connection.query(statsQuery)
    const stats = result.toArray()[0]

    // Calculate change percentages (compare first half vs second half)
    const changeQuery = `
      WITH half_data AS (
        SELECT 
          CASE 
            WHEN ROW_NUMBER() OVER () <= (SELECT COUNT(*) / 2 FROM taxi_data) THEN 'first'
            ELSE 'second'
          END as half,
          COALESCE(total_amount, fare_amount, 0) as revenue
        FROM taxi_data
      )
      SELECT 
        half,
        SUM(revenue) as total_revenue,
        COUNT(*) as trip_count
      FROM half_data
      GROUP BY half
    `

    const changeResult = await connection.query(changeQuery)
    const changeData = changeResult.toArray()

    const firstHalf = changeData.find((row: any) => row.half === "first")
    const secondHalf = changeData.find((row: any) => row.half === "second")

    const revenueChange =
      firstHalf && secondHalf && Number(firstHalf.total_revenue) > 0
        ? ((Number(secondHalf.total_revenue) - Number(firstHalf.total_revenue)) / Number(firstHalf.total_revenue)) * 100
        : 0

    const tripsChange =
      firstHalf && secondHalf && Number(firstHalf.trip_count) > 0
        ? ((Number(secondHalf.trip_count) - Number(firstHalf.trip_count)) / Number(firstHalf.trip_count)) * 100
        : 0

    return {
      totalRecords: Number(stats.totalRecords),
      totalRevenue: Number(stats.totalRevenue),
      averageFare: Number(stats.averageFare),
      averageDistance: Number(stats.averageDistance),
      averagePassengers: Number(stats.averagePassengers),
      totalTrips: Number(stats.totalRecords),
      revenueChange,
      tripsChange,
    }
  } catch (error) {
    console.error("[v0] Error calculating stats:", error)
    return {
      totalRecords: 0,
      totalRevenue: 0,
      averageFare: 0,
      averageDistance: 0,
      averagePassengers: 0,
      totalTrips: 0,
      revenueChange: 0,
      tripsChange: 0,
    }
  }
}

// Generate trend data grouped by date
export async function generateTrendDataFromDB(connection: AsyncDuckDBConnection, maxPoints = 90): Promise<TrendData[]> {
  try {
    // Try different date column names
    const dateColumns = ["tpep_pickup_datetime", "pickup_datetime", "date", "timestamp"]

    let trendQuery = ""
    for (const col of dateColumns) {
      try {
        // Test if column exists
        await connection.query(`SELECT ${col} FROM taxi_data LIMIT 1`)

        trendQuery = `
          SELECT 
            DATE_TRUNC('day', ${col}::TIMESTAMP) as date,
            COUNT(*) as trips,
            SUM(COALESCE(total_amount, fare_amount, 0)) as revenue,
            AVG(COALESCE(total_amount, fare_amount, 0)) as avgFare
          FROM taxi_data
          WHERE ${col} IS NOT NULL
          GROUP BY DATE_TRUNC('day', ${col}::TIMESTAMP)
          ORDER BY date
          LIMIT ${maxPoints}
        `
        break
      } catch {
        continue
      }
    }

    if (!trendQuery) {
      console.warn("[v0] No date column found, returning empty trend data")
      return []
    }

    const result = await connection.query(trendQuery)
    const rows = result.toArray()

    return rows.map((row: any) => ({
      date: new Date(row.date).toISOString().split("T")[0],
      trips: Number(row.trips),
      revenue: Number(row.revenue),
      avgFare: Number(row.avgFare),
    }))
  } catch (error) {
    console.error("[v0] Error generating trend data:", error)
    return []
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(num))
}

// Format percentage
export function formatPercentage(num: number): string {
  return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`
}
