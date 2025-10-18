import * as duckdb from "@duckdb/duckdb-wasm"

let db: duckdb.AsyncDuckDB | null = null
let connection: duckdb.AsyncDuckDBConnection | null = null

export async function initializeDuckDB() {
  if (db) return { db, connection: connection! }

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    }),
  )

  const worker = new Worker(worker_url)
  const logger = new duckdb.ConsoleLogger()
  db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  URL.revokeObjectURL(worker_url)

  connection = await db.connect()

  return { db, connection }
}

export async function loadParquetFile(file: File) {
  const { connection } = await initializeDuckDB()

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer()

  // Register the file in DuckDB
  await db!.registerFileBuffer(file.name, new Uint8Array(buffer))

  // Create a table from the parquet file
  await connection.query(`CREATE OR REPLACE TABLE parquet_data AS SELECT * FROM read_parquet('${file.name}')`)

  return connection
}

export async function executeQuery(query: string) {
  if (!connection) {
    throw new Error("DuckDB not initialized")
  }

  const result = await connection.query(query)
  return result.toArray().map((row) => Object.fromEntries(row))
}

export async function getTableSchema() {
  const result = await executeQuery(`DESCRIBE parquet_data`)
  return result
}

export async function getRowCount() {
  const result = await executeQuery(`SELECT COUNT(*) as count FROM parquet_data`)
  return result[0].count
}

export function closeDuckDB() {
  if (connection) {
    connection.close()
    connection = null
  }
  if (db) {
    db.terminate()
    db = null
  }
}

export async function getDuckDBConnection() {
  if (!connection) {
    const { connection: conn } = await initializeDuckDB()
    return conn
  }
  return connection
}
