import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: number | null; // timestamp ms
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');
const users: Map<string, UserRecord> = new Map();

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function loadFromDisk() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr: UserRecord[] = JSON.parse(raw);
    for (const u of arr) users.set(u.email, u);
  } catch {
    // ignore
  }
}

function persistToDisk() {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(users.values()), null, 2));
}

loadFromDisk();

export async function createUser(email: string, password: string) {
  const existing = users.get(email);
  if (existing) throw new Error('Usuario ya existe');
  const passwordHash = await bcrypt.hash(password, 10);
  const record: UserRecord = {
    id: randomUUID(),
    email,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
  };
  users.set(email, record);
  persistToDisk();
  return { id: record.id, email: record.email };
}

export function getUserByEmail(email: string): UserRecord | undefined {
  return users.get(email);
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 5; // bloqueo tras exceder intentos

export function recordFailedAttempt(user: UserRecord) {
  user.failedAttempts += 1;
  if (user.failedAttempts >= MAX_FAILED) {
    user.lockedUntil = Date.now() + LOCK_MINUTES * 60_000;
  }
  persistToDisk();
}

export function resetFailedAttempts(user: UserRecord) {
  user.failedAttempts = 0;
  user.lockedUntil = null;
  persistToDisk();
}

export function isLocked(user: UserRecord) {
  if (user.lockedUntil && user.lockedUntil > Date.now()) return true;
  if (user.lockedUntil && user.lockedUntil <= Date.now()) {
    // expira bloqueo
    user.lockedUntil = null;
    user.failedAttempts = 0;
    persistToDisk();
  }
  return false;
}

export async function verifyPassword(user: UserRecord, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export function getLockInfo(user: UserRecord) {
  if (!user.lockedUntil) return null;
  return { until: user.lockedUntil, remainingMs: Math.max(0, user.lockedUntil - Date.now()) };
}

export function getLockStatusByEmail(email: string) {
  const user = users.get(email);
  if (!user) return { exists: false, locked: false };
  if (!isLocked(user)) return { exists: true, locked: false };
  return { exists: true, locked: true, remainingMs: Math.max(0, (user.lockedUntil as number) - Date.now()) };
}
