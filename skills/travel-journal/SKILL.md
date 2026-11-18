---
name: travel-journal
description: Turn travel itineraries, local photos, videos and diary notes into an editable map-based travel journal website, or update an existing journal. Use for 旅行手账、旅行回忆网站、地图游记 and travel slideshows. Not for booking trips, researching destinations, making an MP4, or writing Xiaohongshu posts alone.
---

# Travel Journal / 旅行手账

Create a working static website from the user's travel material using the bundled cinematic template. The result includes a world overview, city routes, day-by-day stops, continuous handwritten notes, photo layouts, video playback, browser editing and portable JSON backups. No API key or paid backend is required.

## Start from the material

Use the user's supplied itinerary, text and explicitly provided media folders. Infer the obvious structure; ask only for missing facts that block a useful result. Preserve their language and phrasing unless they ask for rewriting. Do not invent visits, dates, photographs or firsthand experiences. Missing photos can stay empty so the user can upload them later. Use the bundled demonstration only when an example is requested, and label its itinerary as illustrative.

Read [references/input-format.md](references/input-format.md) to create the journal manifest. The script expects a city-level WGS84 coordinate in **[longitude, latitude]** order. Use supplied or verified coordinates; ask or verify uncertain places. Stop coordinates may be omitted, in which case no precise stop marker is claimed. Lines connect the supplied points; they are not navigational road routes.

Use stable, meaningful lowercase IDs for the journal, city visits and stops. Distinct visits to the same city get distinct IDs. Default to the `sky` palette unless the user gives a preference. A new trip does not require copying the sample's destinations, dates or captions.

## Build

Resolve all commands relative to this skill's directory, not the current working directory. Use Node.js 20+ and quote filesystem paths. The scripts use built-in modules only; do not install npm packages or configure an AI service.

1. Create an input JSON manifest near the user's source media. Give it a clear private working location rather than placing personal content in the skill's source folder.
2. Validate it without downloading assets:

   ```sh
   node "<skill-dir>/scripts/build-journal.mjs" --input "<trip.json>" --check
   ```

3. Generate into a **new or empty directory**:

   ```sh
   node "<skill-dir>/scripts/build-journal.mjs" --input "<trip.json>" --output "<my-journal>"
   ```

   Local media must resolve inside the input file's directory by default. For a user-provided media folder elsewhere, pass `--media-root "<folder>"` and put the corresponding paths in the manifest. The builder verifies real paths and copies only referenced media. It refuses to overwrite a nonempty output directory.

   On the first build, the generator downloads about 20 MB of public template assets from the demo origin and verifies every file's SHA-256. These requests send no user photos or diary text. A complete existing cache can be supplied with `--asset-cache "<site-folder>"`; that folder must contain `assets/`. An unavailable or changed asset is an explicit failure. Do not disable checksums or silently substitute uncredited assets. Retain `CREDITS.md` and bundled notices.

4. Preview through HTTP:

   ```sh
   node "<skill-dir>/scripts/serve.mjs" --directory "<my-journal>" --port 8000
   ```

   Open `http://127.0.0.1:8000`. The server binds to this computer only. Do not instruct the user to double-click the HTML: modules, media backups and maps require HTTP. If port 8000 is occupied, use another available port.

## Check the actual result

Verify the requested cities, visit order, dates, day numbers and text. Open the generated site, inspect the cover and one city, start playback, and open a photo in the editor. Check the user's target screen size. Confirm bundled media resolves and the page does not raise JavaScript errors. City street maps and online global city search depend on network availability; report map-provider failures separately from local generator failures.

Browser edits live under this journal's own local storage and IndexedDB namespace. A different journal ID is a separate journal. Test reload persistence when editing behavior changed. Use the backup menu to export a complete JSON and restore/merge it when moving between devices. Opening the site from a different port, domain, browser or device creates a different browser storage origin.

## Update a journal

Prefer the latest `journal.source.json` in the generated site as the editable source. Preserve its IDs, copy it to a private working location as needed, and update only requested content. Paths in that file are relative to the generated site's folder; keep them valid or pass the appropriate media root. Generate the new version into another folder; the builder never overwrites the old website.

If the user has edited inside the browser, first obtain their exported complete JSON backup, or preserve their current browser version and explain that `journal.source.json` reflects the generated source rather than later browser edits. Never claim to have merged unseen browser data. The website can restore or non-destructively merge a portable backup through **备份**. Do not feed the full backup directly to the manifest generator.

On the same origin, a changed generated version preserves existing browser edits and offers **版本** to apply the new seed. Applying it keeps the previous metadata snapshot locally and does not delete media. Full JSON backups remain the way to preserve media independently of the browser. When rebuilding, do not delete the old site's `assets/journal/` if browser edits still reference it.

## Handoff

Return a link to the generated `index.html`, the preview URL if running, and the `journal.source.json` location. Briefly explain how to edit, export a complete backup and resume with this skill. State that this is an interactive website, not an MP4 or cloud-synced service. Publishing a directory makes its bundled media and text public; deploy only when requested. A generic journal-generation request does not authorize uploading private travel material.
