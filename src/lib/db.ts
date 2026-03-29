import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

export type SignerStatus = 'pending' | 'signed';

export interface Signer {
  id: string;
  name: string;
  email: string;
  status: SignerStatus;
}

export interface Document {
  id: string;
  filename: string; // The physical filename in _uploads/
  originalName: string;
}

export interface Signature {
  id: string;
  signerId: string;
  documentId: string;
  x: number;
  y: number;
  scale: number;
  pageIndex?: number;
  base64Image: string;
}

export interface Envelope {
  id: string;
  title: string;
  createdAt: number;
  status: 'sent' | 'completed';
  documents: Document[];
  signers: Signer[];
  signatures: Signature[];
}


export interface DbSchema {
  envelopes: Envelope[];
}

const dbPath = path.join(process.cwd(), '_data', 'db.json');

export const getDb = (): DbSchema => {
  if (!existsSync(dbPath)) {
    const init: DbSchema = { envelopes: [] };
    saveDb(init);
    return init;
  }
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
};

export const saveDb = (db: DbSchema) => {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
};
