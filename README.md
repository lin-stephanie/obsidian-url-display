---
title: README-1.2.0
datetimeCreate: 2023-10-06 16:07:48
datetimeUpdate: 2023-10-24 11:22:39
---
# Obsidian URL Display

The plugin can extract and display external URLs from the active note in [Obsidian](https://obsidian.md/).

![demo](https://github.com/lin-stephanie/obsidian-url-display/blob/main/docs/demo.png)
## Features

- Extract external URLs in the active note (including [kanban](https://github.com/mgmeyers/obsidian-kanban)) and show them in the pane.
- Customize the content displayed in the pane through [plugin setting](#settings). 
- Left-click to navigate to the location of the URL in the active note.
- Middle-click (or click the navigation icon for special case) to open the URL in a new browser tab.
## Usage

### Install plugin

- Directly install from Obsidian Market, or:
- Download the latest release. Extract and put 3 files (main.js,  styles.css, manifest.json) to folder {{obsidian_vault}}/.obsidian/plugins/obsidian-url-display.

### Open URL list

- Select on the plugin icon in the ribbon, or:
- Open the command palette and select the command `URL Display: Open or close pane`.

### Update URL list

- Right select on the plugin icon in the sidebar and select `Refresh list`, or:
- Open the command palette and select the command `URL Display: Refresh list`.

### Pay attentions

- Normally, when you switch between different notes, the URL List will be automatically refreshed.
- After you modify URL, you need to manually refresh the URL list as mentioned above, or trigger refresh by switching notes.
- If you want to display the URL list as soon as possible, it is recommended that enable `Use alias` and disable `Show favicon`.
- If enable `Deduplicate URLs`, you can only navigate to the first occurrence of the URL.
- URLs in inline codes and code blocks are not extracted and displayed.
- For navigating to the location of the URL in callout or table, it dosen't work in Live Preview, and it is not obvious enough in Reading View, but it is okay in Source mode.
## Settings

|           Item                                  |           Description                                                                                                                                                                                                                                                                         |        Value                                       |           Default                |
|:------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------|:---------------------------------|
|           Deduplicate URLs                      |          If enabled, 2 same URLs in the note will only display once.                                                                                                                                                                                                                          |        boolean                                     |  false                           |
| Ignore file property                            | If enabled, URLs in file properties will not be extracted and displayed.                                                                                                                                                                                                                      | boolean                                            | true                             |
|           Use alias                             | If enabled, the text in brackets ([]) will be used to display, otherwise the website title from URL metadata will be used.                                                                                                                                                                    |        boolean                                     |           true                   |
|          Show favicon                           |          If enabled, URL favicons will be shown in the pane.                                                                                                                                                                                                                                  |        boolean                                     |           false                  |
| Show indicator icon                             | If enabled, icons will be shown in the pane to identify URLs. This will only take effect when show favicon is disabled.                                                                                                                                                                       | boolean                                            | true                             |
|           Cache mode                            |           Choose cache mode for saving URL favicons.&nbsp;This will only take effect when show favicon is set to  `true`. See more [details](#about-cache-mode).<br>                                                                                                                          |        disk cache, memory cache                    |           disk cache             |
|         Notice mode                             | Customize the type of notifications when URL parsing finishes.                                                                                                                                                                                                                                |        none, successful, failed, both&nbsp;        |         none                     |  

## Details

### Supported URL formats

```md
https://example.org
[Alias](https://example.org)
[](https://example.org)
```

### About URL metadata

If you enable `Show favicon` or disable `Use alias` in the plugin settings, the plugin will use the free [MicroLink API](https://microlink.io) (`https://api.microlink.io?url=`) to request URL metadata, but there is a limitation: 50 requests/day. Don't worry, the plugin will cache the metadata to avoid repeated requests of same URLs. Note that it takes a certain amount of time to request URL metadata (depending on the number of URLs in the note). 

### About cache mode

If you want to show favicons faster, you can set cache mode to `memory cache`, but please note that it may affect the current performance. If you don't care about speed and there are many URLs, it is recommended to choose `disk cache`.

## Todos

- Improve URL metadata retrieval.
- Support canvas.
- Add global search and copy.
- Add URLs to note footer as footlinks.
- URL list can be downloaded as netscape bookmark file format.

## Thanks

Thanks to the following great plugins for reference and inspiration:
- [joethei/obsidian-link-favicon](https://github.com/joethei/obsidian-link-favicon)
- [Seraphli/obsidian-link-embed](https://github.com/Seraphli/obsidian-link-embed)

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/obsidian-url-display/issues) or [pull request](https://github.com/lin-stephanie/obsidian-url-display/pulls) on obsidian-url-display repository. Thank you in advance for contributing! 

If this plugin adds value for you, I would appreciate if you could give this repository a star. 😊

