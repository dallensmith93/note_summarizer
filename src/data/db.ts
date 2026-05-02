import initSqlJs, { type Database } from "sql.js";
import { SCHEMA_SQL } from "./schema";

const IDB_NAME = "note-summeraizer-sqlite";
const IDB_STORE = "database";
const IDB_KEY = "main";

let databasePromise: Promise<Database> | null = null;
let activeDatabase: Database | null = null;

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(IDB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function readDatabaseBytes(): Promise<Uint8Array | null> {
  const idb = await openIndexedDb();

  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(IDB_STORE, "readonly");
    const store = transaction.objectStore(IDB_STORE);
    const request = store.get(IDB_KEY);

    request.onerror = () => reject(request.error ?? new Error("Could not read SQLite database."));
    request.onsuccess = () => {
      const result = request.result as ArrayBuffer | Uint8Array | undefined;
      if (!result) {
        resolve(null);
        return;
      }
      resolve(result instanceof Uint8Array ? result : new Uint8Array(result));
    };
    transaction.oncomplete = () => idb.close();
    transaction.onerror = () => {
      idb.close();
      reject(transaction.error ?? new Error("IndexedDB read failed."));
    };
  });
}

async function writeDatabaseBytes(bytes: Uint8Array): Promise<void> {
  const idb = await openIndexedDb();

  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(IDB_STORE, "readwrite");
    const store = transaction.objectStore(IDB_STORE);
    store.put(bytes, IDB_KEY);

    transaction.oncomplete = () => {
      idb.close();
      resolve();
    };
    transaction.onerror = () => {
      idb.close();
      reject(transaction.error ?? new Error("IndexedDB write failed."));
    };
  });
}

export async function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => `/${file}`
      });
      const existingBytes = await readDatabaseBytes();
      const db = existingBytes ? new SQL.Database(existingBytes) : new SQL.Database();
      db.run(SCHEMA_SQL);
      activeDatabase = db;
      if (!existingBytes) {
        await persistDatabase();
      }
      return db;
    })();
  }

  return databasePromise;
}

export async function persistDatabase(): Promise<void> {
  const db = activeDatabase ?? (await databasePromise);
  if (!db) {
    return;
  }

  await writeDatabaseBytes(db.export());
}

export async function exportDatabaseBytes(): Promise<Uint8Array> {
  const db = await getDatabase();
  return db.export();
}

export async function replaceDatabase(bytes: Uint8Array): Promise<void> {
  if (activeDatabase) {
    activeDatabase.close();
  }
  activeDatabase = null;
  databasePromise = null;
  await writeDatabaseBytes(bytes);
  await getDatabase();
}
