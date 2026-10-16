K&K OS — THE BIRTHDAY EDITION
Build 18.10 | Local-first editable website
============================================================

READ THIS FIRST
---------------
This is a static HTML/CSS/JavaScript website. No database, paid service,
login, framework or build command is required. Keep the files together.

QUICK START — LOCAL PREVIEW
---------------------------
1. Extract the entire K&K_OS_Birthday_Edition folder.
2. Double-click index.html to preview the site in your browser.
3. Recommended for editing: install Python 3 if it is not already installed,
   then double-click start_local_preview.bat. It opens the site at
   http://127.0.0.1:8000 and keeps a local server running in that terminal.
   Leave that terminal open while editing; press Ctrl+C there to stop the server.
   This is the most reliable mode for browser-local editing and saved changes.
4. For the media folder scanner, double-click refresh_gallery.bat after adding
   or removing photos/videos. Reload the browser tab to see the refreshed wall.
5. You can double-click index.html for a quick preview, but some browsers treat
   file:// pages as a restricted origin. Use start_local_preview.bat for local
   storage and the most reliable edit/refresh workflow. Close the separate server
   terminal when finished.

ADD YOUR PHOTOS — MEMORY VAULT ONLY
----------------------------------
Put the photos/videos in one of these folders:
  media/memory-vault/kartik/   — memories for Kartik
  media/memory-vault/kritika/  — memories for Kritika
  media/memory-vault/shared/   — memories involving both / group memories

Supported image formats: JPG, JPEG, PNG, WebP, GIF
Supported video formats: MP4, WebM, MOV

The filename becomes the Polaroid title automatically, with its extension
removed. Examples:
  Trampoline Madness.png     -> Trampoline Madness
  First Day Together.jpg     -> First Day Together
  The Great Escape.mp4       -> The Great Escape

After adding/removing/renaming photos or videos, double-click refresh_gallery.bat.
It scans your folders and rebuilds media-manifest.js. This is the only refresh
step needed for new media. The scanner never adds those photos to other apps.

OPTIONAL VIDEO COVERS
---------------------
For a video named "Trampoline Madness.mp4", put a poster image beside it called
"Trampoline Madness-cover.jpg" (or .png/.webp). The cover image is used on the
Polaroid but is not shown as a separate Polaroid. If there is no cover, a play
symbol appears on the card.

PROFILE PHOTOS
--------------
Put portraits here:
  media/profiles/kartik.jpg
  media/profiles/kritika.jpg

PNG/JPEG/WebP are supported too. If you use another filename, change the
profileImage value in data.js or in Edit Mode. Examples: kartik.png.
Then run refresh_gallery.bat to refresh the profile portrait catalogue.

TITLES, DATES, MEMORY CAPTIONS & POSITIONS
------------------------------------------
- Titles are derived from each media filename. Rename the file and rerun the
  scanner to change the title.
- Dates/captions can be edited in data.js under the "memories" object, using
  a key exactly like "shared/Trampoline Madness.png". Alternatively, launch
  the website, open Memory Vault, turn on EDIT MODE in the top bar, click a
  Polaroid and edit its date and caption in the close-up view.
- Memory Vault -> Arrange Mode lets you drag each Polaroid. Drag empty wall
  space to pan, and use +/- to zoom. Layout changes save in that browser.
- To carry a final arrangement to hosting, open Edit Mode and click EXPORT
  PUBLISH FILE. This includes saved wall positions.

EDIT PROFILES, QUOTES, LORE, STATS & BIRTHDAY MESSAGES
-----------------------------------------------------
There are two ways:
A. EASIEST: Open the site -> choose a user -> click EDIT MODE in the top bar.
   Select Kartik, Kritika or Shared content in the dropdown. Change the fields.
   Ordinary text saves automatically in that browser. Lists for quotes, stats
   and lore are JSON text fields; keep their brackets, commas and quotation
   marks valid. A starter example is already provided for every list.
B. SOURCE CODE: Open data.js in Notepad, VS Code or another text editor. The
   comments in that file identify each section. Save, then refresh your browser.

IMPORTANT ABOUT LOCAL EDITS VS PUBLISHING
----------------------------------------
Browser localStorage is private to the browser on that computer. It is useful
for working locally, but it does not travel with the files you upload.
When your local edits are ready:
  1. Open the site in your browser and click EDIT MODE.
  2. Click EXPORT PUBLISH FILE. A new custom-overrides.js is downloaded.
  3. Copy that downloaded file into the website folder, replacing the existing
     custom-overrides.js.
  4. Copy any new media files into the media folders.
  5. Run refresh_gallery.bat again so media-manifest.js includes those files.
  6. Upload the ENTIRE folder, keeping the folder structure unchanged.
The downloaded overrides contain profiles, quotes, stats, lore, letters,
shared birthday text, memory captions, and wall positions from the browser.

NOTE: the data.js file is the clean, editable starter source. The exported
custom-overrides.js takes precedence over the starter values. To start a fresh
site without your exported edits, replace custom-overrides.js with the original
small file that contains: window.KK_OVERRIDES = {};

HOSTING / GET ONE SHAREABLE LINK
--------------------------------
Recommended easiest route: Netlify Drop (free static hosting at the time this
manual was written):
  1. Go to https://app.netlify.com/drop in a browser.
  2. Drag the K&K_OS_Birthday_Edition folder (or a ZIP of its contents) into
     the page. Follow any account/sign-in prompts the service shows.
  3. Netlify provides a public link you can share.
  4. If you change photos/data later, refresh the catalogue, replace the
     exported overrides if needed, and redeploy the folder.

You can use GitHub Pages or another static host instead. The website requires
all files to stay together; do not upload only index.html.

WRAPPED.EXE — DOWNLOADABLE STORY PACK
-------------------------------------
Open Wrapped.exe from either desktop or the dock. It reads the current profile,
quotes, stats, lore, birthday notes, and the Memory Vault media catalogue. It does
not replace or remove any existing app or editing feature.

Choose KARTIK OS, KRITIKA OS, or SHARED K&K at the top. Each edition uses its own
visual accent. Click a card in the list to preview it, and use the checkbox to
include or exclude it. Draft birthday cards are excluded from exports by default;
finish the birthday letter in EDIT MODE, then return to Wrapped Studio.

Export options:
  - DOWNLOAD THIS PNG: save the currently previewed card as a 1080 x 1920 PNG.
  - DOWNLOAD SELECTED ZIP: save all checked cards together in one ZIP archive.
  - DOWNLOAD RECAP POSTER: create one 1080 x 1920 highlights poster from selected
    content.
  - SHARE CURRENT CARD: attempts native image sharing on compatible phones and
    browsers. If unsupported, it downloads the PNG for manual posting.
  - SHARE WEBSITE LINK: opens the phone/browser share menu when available. On a
    local preview the copied URL is only your local address; publish the website
    first to get a public link.

MEMORY VAULT CONTENT IN WRAPPED
-------------------------------
After adding photos/videos, run refresh_gallery.bat and reload the site before
opening Wrapped Studio. The first eight matching Memory Vault items are included
in the recap to keep the story pack a manageable size; additional items remain in
the full Memory Vault. Images are embedded into exported story PNGs. Videos receive
a branded video-memory card; the project does not transcode video into story clips.

Wrapped export is generated in your browser and does not upload your media by
itself. Some browsers do not permit native sharing of image files; in that case,
use the downloaded PNG/ZIP and add the images to Instagram Stories or WhatsApp
Status manually. Direct automatic posting to social accounts is not provided.

EDIT MODE SHORTCUT
------------------
Press Ctrl+E (Windows) or Cmd+E (Mac) to open/close Edit Mode while on a desktop.
The start_local_preview.bat helper requires Python 3 and uses port 8000.

DESIGN / CONTENT NOTES
----------------------
- The examples and statistics are intentionally placeholder humour, not factual
  claims. Replace anything that doesn't fit your friends.
- There are starter quote/lore entries to make editing straightforward. Replace
  bracketed instructions with real inside jokes and memories.
- The app does not upload or send photos anywhere by itself. Images/videos are
  files in the website folder and will be public after you publish the site.
- Profile/data edits in a running browser save locally, not to a server. Use
  EXPORT PUBLISH FILE to carry them into the published folder.
