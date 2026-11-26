import { router } from 'expo-router';
import { deleteFlight } from '@/db/repo';
import { formatDate } from '@/lib/format';
import type { Flight } from '@/lib/types';
import { showDialog } from './Dialog';

export function confirmDelete(f: Flight, after?: () => void) {
  showDialog({
    icon: 'trash-2',
    title: 'Delete flight?',
    message: `${f.fromIata} → ${f.toIata} on ${formatDate(f.date)} will be removed from your log.`,
    buttons: [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteFlight(f.id)
            .then(() => after?.())
            .catch((e) => showDialog({ title: 'Couldn’t delete', message: String(e) }));
        },
      },
    ],
  });
}

export function duplicateReturn(f: Flight) {
  router.push({ pathname: '/add/manual', params: { returnOf: f.id } });
}

export function showFlightActions(f: Flight) {
  showDialog({
    icon: 'send',
    title: `${f.fromIata} → ${f.toIata}`,
    buttons: [
      { text: 'Duplicate as return', onPress: () => duplicateReturn(f) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(f) },
      { text: 'Cancel', style: 'cancel' },
    ],
  });
}
