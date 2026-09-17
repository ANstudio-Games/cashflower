import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { exportAllData, importAllData } from '@/db';
import { BackupData } from '@/types';

export async function backupToGoogleDriveOrShare(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const data = await exportAllData(db);
    const jsonString = JSON.stringify(data, null, 2);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `cashflower_backup_${dateStr}.json`;

    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Simpan ke Google Drive atau Bagikan Cadangan',
        UTI: 'public.json',
      });
      return true;
    } else {
      throw new Error('Fitur berbagi file tidak tersedia di perangkat ini.');
    }
  } catch (err: any) {
    console.error('Backup error:', err);
    throw err;
  }
}

export async function restoreFromBackupFile(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return 0; // Canceled by user
    }

    const asset = result.assets[0];
    const content = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const backupData: BackupData = JSON.parse(content);

    // Validate that it is a cashflower backup
    if (!backupData || !Array.isArray(backupData.transactions) || !Array.isArray(backupData.categories)) {
      throw new Error('Format file cadangan tidak valid atau rusak.');
    }

    await importAllData(db, backupData);
    return backupData.transactions.length;
  } catch (err: any) {
    console.error('Restore error:', err);
    throw err;
  }
}
