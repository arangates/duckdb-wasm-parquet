import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "parquet-viewer-db"
const STORE_NAME = "parquet-files"
const DB_VERSION = 1

interface StoredFile {
  id: string
  name: string
  size: number
  uploadedAt: number
  data: ArrayBuffer
}

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" })
        }
      },
    })
  }
  return dbPromise
}

export async function saveFile(file: File): Promise<string> {
  const db = await getDB()
  const id = `${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const storedFile: StoredFile = {
    id,
    name: file.name,
    size: file.size,
    uploadedAt: Date.now(),
    data: arrayBuffer,
  }

  await db.put(STORE_NAME, storedFile)
  return id
}

export async function getFile(id: string): Promise<File | null> {
  const db = await getDB()
  const storedFile = await db.get(STORE_NAME, id)

  if (!storedFile) return null

  return new File([storedFile.data], storedFile.name, {
    type: "application/octet-stream",
  })
}

export async function getAllFiles(): Promise<Array<{ id: string; name: string; size: number; uploadedAt: number }>> {
  const db = await getDB()
  const files = await db.getAll(STORE_NAME)

  return files.map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    uploadedAt: file.uploadedAt,
  }))
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearAllFiles(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
