/**
 * Header photo for each seed event, by slug. Free-licence photos from Unsplash
 * (https://unsplash.com/license), served from their CDN. An event's own imageUrls,
 * set in /admin, always win over these.
 */
const PHOTO_IDS: Record<string, string> = {
  'beginner-bouldering': '1564769662533-4f00a87b4056',
  'padel-cup': '1612534847738-b3af9bc31f0c',
  'boxing-martial-arts-intro': '1716307043003-dbe6a5cc496e',
  'beginner-fencing': '1631529819887-5b4340090570',
  'pickup-basketball': '1546519638-68e109498ffc',
  'ping-pong-challenge': '1646978567314-32cfd5a8854e',
  'swim-and-sauna': '1558617320-e695f0d420de',
  'running-club': '1552674605-db6ffd4facb5',
  'mafia-werewolf-night': '1607438802263-ada36dae55c5',
  'chess-challenge': '1586165368502-1bad197a6461',
  'board-game-discovery': '1629760946220-5693ee4c46ac',
  'video-game-tournament': '1493711662062-fa541adb3fc8',
  'themed-pub-quiz': '1558210598-89ba75b1724e',
  'clay-making-workshop': '1595351298020-038700609878',
  'short-film-challenge': '1485846234645-a62644f84728',
  'poetry-open-mic': '1511671782779-c97d3d27a1d4',
  'thrift-and-style-swap': '1540221652346-e5dd6b50f3e7',
  'photography-challenge': '1554080353-321e452ccf19',
  'sketch-and-social': '1602738328654-51ab2ae6c4ff',
  'music-jam-night': '1481886756534-97af88ccb438',
  'beginner-salsa-social': '1504609813442-a8924e83f76e',
  'cooking-challenge': '1763570645098-371723617ee9',
  'reading-meetup': '1457369804613-52c61a468e7d',
  'mock-exam-session': '1460518451285-97b6aa326961',
  'machine-learning-jam': '1555066931-4365d14bab8c',
  'build-an-app-challenge': '1563461660947-507ef49e9c47',
  'friendly-debate': '1517048676732-d65bc937f952',
  'language-exchange-games': '1543269865-cbf427effbad',
  'hiking-trip': '1551632811-561732d1e306',
  'cycling-adventure': '1673890704132-9573476ac27c',
  'kayaking-adventure': '1480480565647-1c4385c7c0bf',
  'camping-weekend': '1504280390367-361c6d9f38f4',
  'beginner-surfing-trip': '1502933691298-84fc14542831',
};

export function seedPhoto(slug?: string, width = 800): string | undefined {
  const id = slug ? PHOTO_IDS[slug] : undefined;
  return id ? `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70` : undefined;
}

/** The event's own first photo, else its seed photo. */
export function photoFor(e: { imageUrls?: string[]; slug?: string }, width = 800): string | undefined {
  return e.imageUrls?.find((u) => u && u.trim() !== '') ?? seedPhoto(e.slug, width);
}
