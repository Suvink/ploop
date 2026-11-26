import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { buildBackup, planImport, type ImportReport } from '@/lib/backup';
import { settingsFromRows } from '@/lib/settings';
import { applyImport, getAllFlights, getSettingRows } from './repo';

/** Writes a JSON backup to the cache and opens the share sheet (save to Files, Drive, etc.). */
export async function exportJson(): Promise<void> {
  const [flights, rows] = await Promise.all([getAllFlights(), getSettingRows()]);
  const backup = buildBackup(settingsFromRows(rows), flights, new Date());
  const name = `ploop-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup, null, 2));
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Ploop backup',
      UTI: 'public.json',
    });
  } finally {
    if (file.exists) file.delete();
  }
}

export async function pickBackupText(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (r.canceled || !r.assets?.[0]) return null;
  const file = new File(r.assets[0].uri);
  try {
    return await file.text();
  } finally {
    try {
      if (file.exists) file.delete();
    } catch {
      // cache copy already removed
    }
  }
}

export async function importJson(text: string, mode: 'merge' | 'replace'): Promise<ImportReport> {
  const existing = await getAllFlights();
  const plan = planImport(text, existing, mode);
  await applyImport(plan.toInsert, plan.toUpdate, mode, plan.settings);
  return plan.report;
}
