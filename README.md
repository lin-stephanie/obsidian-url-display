# Obsidian URL Display

This [Obsidian](https://obsidian.md/) plugin can extract external URLs from the active note and display them in the pane.

![demo](https://github.com/lin-stephanie/obsidian-url-display/blob/main/docs/demo.png)
## Features

- Extract external URLs in the active note and show them in the pane.
- Customize the content displayed in the pane through [plugin setting](#settings). 
- Left-click to navigate to the location of the URL in the active note.
- Middle-click (or click the navigation icon for special case) to open the URL in a new browser tab.
## Usage

### Install

- Directly install from Obsidian Market, or:
- Download the latest release. Extract and put 3 files (main.js,  styles.css, manifest.json) to folder {{obsidian_vault}}/.obsidian/plugins/obsidian-url-display.

### Enable

- Move focus into a note, then:
- Select on the plugin icon in the ribbon, or:
- Open the command palette and select the command `URL Display: Open or close pane`.

### Update URL list

- Keep focus in a note, then:
- Right select on the plugin icon in the sidebar and select `Refresh list`, or:
- Open the command palette and select the command `URL Display: Refresh list`.

### Tips

- Normally, when you switch between different notes, the URL List will be automatically updated.
- After you modify URL in the active note, you need to manually refresh the URL list as mentioned above.
- Note that the plugin also extract URLs in code, code block, callout and document property.
- In Live Preview mode, the location reminder for the URL in callout is not obvious enough.
## Settings

|          Item                                 |          Description                                                                                                                                                                                                                                                                        |       Value                                      |          Default               |
|:----------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------|:-------------------------------|
|          Deduplicate URLs                     |         If enabled, 2 same URLs in the note will only display once.                                                                                                                                                                                                                         |       boolean                                    | false                          |
|          Use alias                            |          By default, the website title from URL metadata is used as the display text. If enabled, the text in brackets ([]) will be used.                                                                                                                                                   |       boolean                                    |          true                  |
|         Show favicon                          |         If disabled, the pane will not show the favicon, but only the text.                                                                                                                                                                                                                 |       boolean                                    |          false                 |
|          Cache mode                           |          Choose cache mode for saving favicons. This will only take effect when show favicon is set to  `true`. See more [details](#about-cache-mode).                                                                                                                                      |       disk cache, memory cache                   |          disk cache            |
|        Notice mode                            |        You can customize the type of notifications when URL parsing finishes.                                                                                                                                                                                                               |       none, successful, failed, both&nbsp;       |        none                    |  

## Details

### Supported URL formats

```md
https://example.org
[Alias](https://example.org)
[](https://example.org)
```

### REST API used

If you enable `Show favicon` or disable `Use alias` in the plugin settings, the plugin will use the free [MicroLink API](https://microlink.io) (`https://api.microlink.io?url=`) to request URL metadata, but there is a limitation: 50 requests/day. Don't worry, the plugin will cache the metadata to avoid repeated requests of same URLs.

Note that it takes a certain amount of time to request URL metadata (depending on the number of URLs in the note). **If you want to display the URL list as soon as possible, it is recommended that disable `Show favicon` and enable `Use alias`.**

### About cache mode

If you want the favicon to appear faste, you may choose `memory cache`, but please note that it may affect the current performance. If you don't care about speed and there are many URLs, it is recommended to choose `disk cache`.

## Todos

- Optionally exclude URLs in code, code blocks, and document properties.
- Add global search and copy features.
- Support extracting URLs from other plugin views (such as Kanban).
- Add external URLs to note footer as footlinks.
- URL list can be downloaded as netscape bookmark file format.

## Thanks

Thanks to the following great plugins for reference and inspiration:
- [joethei/obsidian-link-favicon](https://github.com/joethei/obsidian-link-favicon)
- [Seraphli/obsidian-link-embed](https://github.com/Seraphli/obsidian-link-embed)

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/obsidian-url-display/issues) or [pull request](https://github.com/lin-stephanie/obsidian-url-display/pulls) on obsidian-url-display repository. Thank you in advance for contributing! 

If this plugin adds value for you, I would appreciate if you could give this repository a star. 😊

