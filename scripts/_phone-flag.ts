/** For checks: set the phone_system toggle on the DEV database, and put back whatever was there. */
import { prisma } from "../src/lib/db";

const KEY = "phone_system";
type Row = Awaited<ReturnType<typeof prisma.featureFlag.findUnique>>;

export const setPhoneSystem = (enabled: boolean) =>
  prisma.featureFlag.upsert({
    where: { key: KEY }, create: { key: KEY, enabled, enabledAt: enabled ? new Date() : null }, update: { enabled, enabledAt: enabled ? new Date() : null },
  });
export const savePhoneSystem = (): Promise<Row> => prisma.featureFlag.findUnique({ where: { key: KEY } });
export async function restorePhoneSystem(before: Row) {
  await prisma.featureFlag.deleteMany({ where: { key: KEY } });
  if (before) await prisma.featureFlag.create({ data: before });
}
