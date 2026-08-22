// Minimal ambient typings for Node's built-in `node:sqlite` (experimental).
declare module "node:sqlite" {
  export type SQLValue = string | number | bigint | null | Uint8Array;
  export interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: bigint };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }
  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }
}
