declare module "sql.js" {
  export type SqlValue = string | number | Uint8Array | null;
  export type BindParams = SqlValue[] | Record<string, SqlValue>;

  export interface Statement {
    bind(values?: BindParams): boolean;
    step(): boolean;
    getAsObject(): Record<string, SqlValue>;
    free(): void;
  }

  export interface Database {
    run(sql: string, params?: BindParams): Database;
    prepare(sql: string): Statement;
    exec(sql: string): Array<{ columns: string[]; values: SqlValue[][] }>;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
