# 环球旅行游记 / Global Travel Journal

## 旅行手账 Skill / Travel Journal Skill

把行程、自己的照片/视频和日记交给 AI，生成一份可编辑、可放映的地图旅行手账网站，也能继续追加行程和素材。

**[查看 Skill、安装方法和使用示例 →](skills/travel-journal/README.md)** · [Skill 指令](skills/travel-journal/SKILL.md) · [示例行程](skills/travel-journal/examples/coastal-weekend.json)

```text
使用 $travel-journal，把我的三天行程和 photos 文件夹做成浅蓝色旅行手账，保留原来的日记文字。
```

第一版提供完整网站模板、行程生成器、独立的浏览器保存空间、媒体打包、备份导入和示例。生成与本地规则排版不需要 API Key；首次构建需要联网下载并校验公开模板素材。浏览器编辑不等于云同步，输出是交互网站。

---

A cinematic, map-first travel storytelling prototype, presented as a public portfolio demo with San Francisco and Seattle.

**Live demo:** https://travel-journal-interview-demo.goldenbean22.chatgpt.site/

![Public sample: Golden Gate Bridge](https://travel-journal-interview-demo.goldenbean22.chatgpt.site/assets/demo/golden-gate.jpg)

## Try it

1. Select **开始放映** to move from the United States overview into San Francisco and Seattle, each with its own map palette and music.
2. Follow the street-level route from California Street to the Golden Gate Bridge.
3. Click a photograph to open the interactive viewer; use the arrows to browse.
4. Open **照片 / 视频编辑** to upload multiple assets, drag and resize images, add text, reorder pages and adjust video volume. These changes stay in your own browser.
5. Open **AI 版面设计** to learn how a self-hosted AI layout endpoint can be connected. No paid AI service is configured in this demo.
6. Pause, skip a scene, change playback speed, or enter fullscreen.

## Design and implementation

- A 16:9 presentation stage, rather than a scrolling portfolio page.
- MapLibre GL camera transitions and geographic route markers, with a D3/TopoJSON overview map.
- Scene-based playback, independently timed handwriting, photo parallax and a keyboard-accessible image viewer.
- Photo scenes accelerate separately from video; video retains its original duration.
- Background music has a gradual fade and ducks during video playback.
- A public sample state replaces browser-local personal journals. The visible demo editor stores edits in a separate browser-local sample. It never publishes visitors’ uploads.

The project owner directed the visual and interaction requirements and iterated on the experience with AI-assisted development. This repository does not claim that every line was independently hand-coded. This is a portfolio prototype, not a production multi-user service.

## Content and privacy

This repository includes **no personal travel photos, diaries, backups, account credentials, or precise home address**. The route and text are illustrative. The 8-second video is an explicitly labelled photo motion study made from the licensed bridge photograph, not live travel footage. Attribution and licenses are in [CREDITS.md](dist/CREDITS.md).

## Local preview

Requires Node.js 20+ to fetch the public licensed assets, then Python 3 or any static web server:

```sh
node prepare-assets.mjs
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Live street maps require an internet connection. Browser audio starts after a user gesture. No API key, paid AI backend, or account is needed to view the demonstration. The source is stored in this repository; the asset preparation script retrieves licensed photos, fonts, music and map libraries from the public demo origin.

## GitHub Pages

The included workflow deploys `dist/` using GitHub Pages. After uploading the repository, select **Settings → Pages → Source → GitHub Actions**. The live Pages URL will appear on a successful deployment. The bundled background-music URL is relative so repository subpaths work.

## Scope and limitations

The original editor supports local media upload, collage layout, per-video volume, JSON backup/merge, city introductions and daily stops. This public demo exposes playback and local image/video editing, with two city palettes and soundtracks. An optional custom layout endpoint accepts media dimensions and text lengths, not the photos or original text. No secret key is requested by the browser. Browser-local edits are not cloud synchronization. Online map availability depends on the external map provider.

Source is provided for portfolio review; no blanket license is granted for the original application code or branding. Third-party assets remain under their own licenses.

## Global edition

The overview now uses a world map. Shanghai and Beijing are editable sample cities alongside the two US samples. Sample dates are illustrative. Add cities and daily stops from the travel editor. Complete JSON backup, restore, non-destructive mobile merge, and per-trip/per-stop exports are available from the backup menu. Visitors' data remain browser-local; this is not cloud synchronization.

## City search and clean map view

The cover uses a bundled world map. Header actions use short labels and collapse automatically in city views; the menu button restores every tool. Palette names describe colors, and each city chooses its own palette. Chinese search uses a bundled GeoNames index of 18,808 populated administrative seats and administrative areas, with Chinese aliases and coordinates. Worldwide search falls back to Open-Meteo geocoding. Search results remain editable; gazetteer completeness and network availability are not guaranteed.

