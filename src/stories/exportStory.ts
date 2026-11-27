import { Image, type View } from 'react-native';
import type { RefObject, ComponentRef } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { STORY_H, STORY_W } from './common';

export const ALBUM_NAME = 'Ploop';

export async function captureStory(
  ref: RefObject<ComponentRef<typeof View> | null>,
): Promise<string> {
  if (!ref.current) throw new Error('Story is not ready yet');
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    width: STORY_W,
    height: STORY_H,
    result: 'tmpfile',
  });
  if (__DEV__) {
    Image.getSize(
      uri,
      (w, h) => {
        if (w !== STORY_W || h !== STORY_H)
          console.warn(`[story] Exported PNG is ${w}×${h}, expected ${STORY_W}×${STORY_H}`);
        else console.log(`[story] Exported PNG is ${w}×${h} ✓`);
      },
      (e) => console.warn('[story] Could not read exported size', e),
    );
  }
  return uri;
}

/** Capture any view as a PNG at the screen's native resolution (e.g. a passport page). */
export async function captureView(view: ComponentRef<typeof View> | null): Promise<string> {
  if (!view) throw new Error('Page is not ready yet');
  return captureRef(view, { format: 'png', quality: 1, result: 'tmpfile' });
}

function cleanup(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // temp file already gone
  }
}

export type SaveResult = 'saved' | 'denied';

/**
 * Saves into a "Ploop" album. Write-only: on Android 13+ this needs no photo permission at all
 * (READ_MEDIA_IMAGES is blocked in app.json, per Google Play's photo permissions policy), and
 * the album lookup only ever sees images Ploop saved itself.
 */
export async function saveToGallery(uri: string): Promise<SaveResult> {
  const perm = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) return 'denied';
  try {
    try {
      const album = await MediaLibrary.Album.get(ALBUM_NAME);
      if (album) await MediaLibrary.Asset.create(uri, album);
      else await MediaLibrary.Album.create(ALBUM_NAME, [uri], false);
    } catch {
      // Album unavailable (e.g. left over from an earlier install): save to Pictures instead.
      await MediaLibrary.Asset.create(uri);
    }
  } finally {
    cleanup(uri);
  }
  return 'saved';
}

export async function shareImage(uri: string, title = 'Share story'): Promise<void> {
  try {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
  } finally {
    cleanup(uri);
  }
}
