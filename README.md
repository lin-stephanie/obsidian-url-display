# Obsidian URL Display

The plugin can extract and display external URLs from the active note in [Obsidian](https://obsidian.md/). Check out the [demo](https://youtu.be/Xx_9wOXePLo) on how to use this plugin.

![screenshot](https://github.com/lin-stephanie/obsidian-url-display/blob/main/docs/screenshot.png)

## Features

- Extract external URLs in the active note (including [kanban](https://github.com/mgmeyers/obsidian-kanban)) and show them in the pane.
- Customize the content displayed in the pane through plugin settings page, including deduplicate URLs, ignore file property, use alias, show favicon, show indicator icon, hover link preview...
- Left-click to navigate to the location of the URL in the active note.
- Middle-click (or click the navigation icon for special case) to open the URL in a new browser tab.
- Right-click to copy URL or conduct a global search.

## Installation

- Directly install from Obsidian's community plugins, or:
- Download the latest release. Extract and put 3 files (main.js,  styles.css, manifest.json) to folder {{obsidian_vault}}/.obsidian/plugins/obsidian-url-display.

## Usage

**Open the pane**

- Select on the plugin icon in the ribbon, or:
- Open the command palette and select the command `URL Display: Open or close pane`.

**Update URL list** 

- Right select on the plugin icon in the sidebar and select `Refresh list`, or:
- Open the command palette and select the command `URL Display: Refresh list`.

**Please note**

- Normally, when you switch between different notes, the URL List will be automatically refreshed.
- After you modify URL, you need to manually refresh the URL list as mentioned above, or trigger refresh by switching notes.
- If you want to display the URL list as soon as possible, it is recommended that enable `Use alias` and disable `Show favicon`.
- If enable `Deduplicate URLs`, you can only navigate to the first occurrence of the URL.
- URLs in inline codes and code blocks are not extracted and displayed.
- For navigating to the location of the URL in callout or table, it dosen't work in Live Preview, and it is not obvious enough in Reading View, but it is okay in Source Mode.

## Details

**Supported URL formats**

```md
https://example.org
[Alias](https://example.org)
[](https://example.org)
```

**About URL metadata**

If you enable `Show favicon` or disable `Use alias` in the plugin settings, the plugin will use the free [MicroLink API](https://microlink.io) (`https://api.microlink.io?url=`) to request URL metadata, but there is a limitation: 50 requests/day. Don't worry, the plugin will cache the metadata to avoid repeated requests of same URLs. Note that it takes a certain amount of time to request URL metadata (depending on the number of URLs in the note). 

**About cache mode**

If you want to show favicons faster, you can set cache mode to `memory cache`, but please note that it may affect the current performance. If you don't care about speed and there are many URLs, it is recommended to choose `disk cache`.

## Todos

- Improve URL metadata retrieval.
- Support canvas, memo and other views.
- Add URLs to note footer as footlinks.
- Add lock the view feature.

## Thanks

Thanks to the following great plugins for reference and inspiration:

- [joethei/obsidian-link-favicon](https://github.com/joethei/obsidian-link-favicon)
- [Seraphli/obsidian-link-embed](https://github.com/Seraphli/obsidian-link-embed)

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/obsidian-url-display/issues) or [pull request](https://github.com/lin-stephanie/obsidian-url-display/pulls) on obsidian-url-display repository. Thank you in advance for contributing! 

If this plugin adds value for you, I would appreciate if you could give this repository a star. 😊

