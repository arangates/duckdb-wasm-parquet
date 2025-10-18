import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm"

export interface ColumnProfile {
  name: string
  type: string
  count: number
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  cardinality: number
  min?: any
  max?: any
  avg?: number
  median?: number
  stdDev?: number
  topValues?: Array<{ value: any; count: number; percentage: number }>
}

export interface DataProfile {
  totalRows: number
  totalColumns: number
  columns: ColumnProfile[]
  dataQualityScore: number
  completeness: number
}

export async function profileData(connection: AsyncDuckDBConnection): Promise<DataProfile> {
  // Get total row count
  const countResult = await connection.query("SELECT COUNT(*) as count FROM parquet_data")
  const totalRows = Number(countResult.toArray()[0].count)

  // Get column information
  const columnsResult = await connection.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'parquet_data'
    ORDER BY ordinal_position
  `)
  const columnsInfo = columnsResult.toArray()

  const columns: ColumnProfile[] = []
  let totalNulls = 0

  for (const col of columnsInfo) {
    const columnName = col.column_name as string
    const dataType = col.data_type as string

    // Basic statistics
    const statsResult = await connection.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(${columnName}) as non_null_count,
        COUNT(DISTINCT ${columnName}) as unique_count
      FROM parquet_data
    `)
    const stats = statsResult.toArray()[0]
    const count = Number(stats.count)
    const nonNullCount = Number(stats.non_null_count)
    const uniqueCount = Number(stats.unique_count)
    const nullCount = count - nonNullCount
    const nullPercentage = (nullCount / count) * 100

    totalNulls += nullCount

    const profile: ColumnProfile = {
      name: columnName,
      type: dataType,
      count,
      nullCount,
      nullPercentage,
      uniqueCount,
      cardinality: uniqueCount / count,
    }

    // Numeric statistics
    if (
      dataType.includes("INT") ||
      dataType.includes("DOUBLE") ||
      dataType.includes("DECIMAL") ||
      dataType.includes("FLOAT") ||
      dataType.includes("NUMERIC")
    ) {
      try {
        const numericStatsResult = await connection.query(`
          SELECT 
            MIN(${columnName}) as min,
            MAX(${columnName}) as max,
            AVG(${columnName}) as avg,
            MEDIAN(${columnName}) as median,
            STDDEV(${columnName}) as stddev
          FROM parquet_data
          WHERE ${columnName} IS NOT NULL
        `)
        const numericStats = numericStatsResult.toArray()[0]
        profile.min = numericStats.min
        profile.max = numericStats.max
        profile.avg = Number(numericStats.avg)
        profile.median = Number(numericStats.median)
        profile.stdDev = Number(numericStats.stddev)
      } catch (error) {
        console.error(`[v0] Error getting numeric stats for ${columnName}:`, error)
      }
    }

    // Top values (for low cardinality columns)
    if (uniqueCount <= 100) {
      try {
        const topValuesResult = await connection.query(`
          SELECT 
            ${columnName} as value,
            COUNT(*) as count
          FROM parquet_data
          WHERE ${columnName} IS NOT NULL
          GROUP BY ${columnName}
          ORDER BY count DESC
          LIMIT 10
        `)
        const topValues = topValuesResult.toArray().map((row) => ({
          value: row.value,
          count: Number(row.count),
          percentage: (Number(row.count) / nonNullCount) * 100,
        }))
        profile.topValues = topValues
      } catch (error) {
        console.error(`[v0] Error getting top values for ${columnName}:`, error)
      }
    }

    columns.push(profile)
  }

  const totalCells = totalRows * columns.length
  const completeness = ((totalCells - totalNulls) / totalCells) * 100
  const dataQualityScore = calculateDataQualityScore(columns, completeness)

  return {
    totalRows,
    totalColumns: columns.length,
    columns,
    dataQualityScore,
    completeness,
  }
}

function calculateDataQualityScore(columns: ColumnProfile[], completeness: number): number {
  // Simple scoring: 50% completeness, 30% cardinality, 20% type consistency
  const cardinalityScore = columns.reduce((sum, col) => sum + Math.min(col.cardinality, 1), 0) / columns.length
  const score = completeness * 0.5 + cardinalityScore * 30 + 20
  return Math.min(Math.round(score), 100)
}
