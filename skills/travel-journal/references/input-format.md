# Journal input / 输入格式

UTF-8 JSON, optionally with a BOM. Paths are relative to the input JSON. `--media-root` defaults to that JSON's directory and must contain every referenced local file, including symlink targets. Absolute local paths work only inside this root. HTTP URLs, data URLs and browser backup objects are not accepted as media inputs.

```json
{
  "id": "my-coastal-weekend",
  "title": "沿着海岸，慢慢走",
  "subtitle": "旧金山 → 西雅图 · 周末回忆",
  "palette": "sky",
  "settings": { "photoSeconds": 12, "musicVolume": 28 },
  "trips": [
    {
      "id": "sf-weekend",
      "name": "San Francisco",
      "cn": "旧金山",
      "coord": [-122.4194, 37.7749],
      "date": "2026-05-01",
      "endDate": "2026-05-02",
      "transport": "train",
      "palette": "sky",
      "note": "旅程的开场文字。",
      "stops": [
        {
          "id": "golden-gate",
          "name": "金门大桥",
          "en": "Golden Gate Bridge",
          "coord": [-122.4783, 37.8199],
          "day": 1,
          "note": "在这里写下当天的回忆。",
          "media": [{ "src": "photos/bridge.jpg", "name": "海湾边的风", "ratio": 1.5 }]
        }
      ]
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `id` | Required stable journal ID, at most 64 lowercase letters/digits/hyphens. Different IDs isolate browser state and media. |
| `title`, `subtitle` | Required title; optional subtitle. Plain text, including Chinese. A newline in the title creates two cover lines. |
| `palette` | Default color palette. Each trip can override it. |
| `trips` | 1–100 city visits, in the intended travel order. A second visit to a city is a separate object. |
| Trip `id`, stop `id` | Stable IDs, unique across all trips/stops, at most 80 characters. Automatic index IDs exist for quick inputs; assign explicit IDs before later reordering. |
| Trip `name`, `cn` | Required city name and optional alternate/Chinese name. Both may be Chinese when appropriate. |
| Trip `coord` | Required `[longitude, latitude]`, WGS84. Do not reverse these values. |
| `date`, `endDate`, `days` | Optional real ISO dates. The end date defaults from the maximum stop day or `days`; all stops must fit the range, at most 365 days. Without dates, use `days` or stop day numbers. |
| `transport` | `flight`, `train` (default), `car`, `walk`. |
| `note` | City introduction or stop diary, at most 10,000 characters. Preserve factual content and line breaks. |
| `stops` | 1–300 stops for a city visit. Required stop `name` (max 100 characters); optional `en` (max 150), `coord`, `note`. |
| Stop `day` | Integer 1–365; default 1, relative to the trip start date. |
| Stop `media` | Optional array. Each item requires `src`; optional `name`, image `ratio`, duration in seconds, and video `volume` between 0 and 1 (default muted). |
| Trip `music` | Optional local audio object, e.g. `{ "src": "audio/song.mp3", "name": "My soundtrack" }`. The user supplies the file and usage rights. Global `musicVolume` controls playback loudness. No automatic copyrighted song downloads. |

Supported photos: JPEG, PNG, WebP, GIF, AVIF. Convert HEIC before building. Video: MP4, M4V, WebM, MOV; browser codec support still varies, so prefer H.264 MP4. Audio: MP3, WAV, OGG, M4A, Opus. The generator copies files; it does not transcode them, strip EXIF metadata, or export a film.

Palette keys: `sky` (light blue), `citrus` (yellow-green), `lilac`, `peach`, `autumn`, `sf` (dark blue/gold), `seattle` (dark green), `boston` (sand), `la` (blue-green), `dc` (pale green), `philadelphia` (gray-white), `ny` (pale pink), `pink` (midnight blue/pink). Palette names are colors; they do not constrain destinations.

Settings: `photoSeconds` 2–20, `coverSeconds` 3–15, `typeSpeed` 1–60, `readHold` 0–60, `musicVolume` 0–100. Photos play at the template's 2× segment tempo; map/transport scenes use 3×; videos keep their native duration. `photoSeconds` is the scene's base duration before tempo and playback-speed controls.

For a demonstration, `src: "asset:demo/golden-gate.jpg"`, `asset:demo/bridge-detail.jpg`, `asset:demo/bridge-motion.mp4`, `asset:demo/seattle.jpg`, or licensed audio `asset:music/san-francisco.mp3` / `asset:music/seattle.mp3` can refer to bundled public assets. These are illustrative, credited media; never present them as the user's own photos or footage. See [../examples/coastal-weekend.json](../examples/coastal-weekend.json).

Output contains all runtime code/assets, the user's referenced media under hashed filenames, `journal-data.js`, `journal.source.json`, `CREDITS.md` and `START-HERE.txt`. The source manifest uses packaged paths, avoiding disclosure of original absolute filesystem paths. Subsequent browser changes are held in localStorage/IndexedDB, not written back into `journal.source.json`.
