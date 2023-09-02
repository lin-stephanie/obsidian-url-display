# Obsidian URL Display

This [Obsidian](https://obsidian.md/) plugin can extract external URLs from the active note and display them in the pane opened from the ribbon. You can adjust the content displayed in the pane through [plugin setting](#settings).

This is how it [looks](https://youtu.be/w5nlhg8Bq-0). 

![demo](https://github.com/lin-stephanie/obsidian-url-display/blob/main/docs/demo.png)
## Motivation

I often clip and paste some blog articles to my Obsidian vault for reading and taking notes, sometimes I want to extract all the external URLs in a note and open them in the browser, just like obsidian's native internal links. So I made this plugin, which currently can:

- Extract external URLs in the active note and show them in the pane
- Select to open the external URLs like a bookmark bar 

If you are interested, you can go to [Polls](https://github.com/lin-stephanie/obsidian-url-display/discussions/1) to vote for the new features what I want to implement next.
## Usage

### Install
- Directly install from Obsidian Market, or:
- Download the latest release. Extract and put 3 files (main.js,  styles.css, manifest.json) to folder {{obsidian_vault}}/.obsidian/plugins/obsidian-url-display.

### Enable
- Move focus into a note, then:
- Select on the plugin icon in the ribbon, or:
- Open the command palette and select the command `URL Display: Open or close pane`

### Update URL list
- Right select on the plugin icon in the sidebar and select `Refresh list`, or:
- Open the command palette and select the command `URL Display: Refresh list`

### Tips
- Normally, when you switch between different notes, the URL List will be automatically updated.
- After you modify URL in the active note, you need to manually refresh the URL list as mentioned above.

## Settings

|        Item                               |        Description                                                                                                                                                                                                                                   |     Value                                    |        Default             |
|:------------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------|:---------------------------|
|        Deduplicate URLs                   |       If enabled, 2 same URLs in the note will only display once.                                                                                                                                                                                    |     boolean                                  |        ture               |
|        Use alias                          |        By default, the website title from URL metadata is used as the display text. If enabled, the text in brackets ([]) will be used.                                                                                                              |     boolean                                  |        false                |
|       Show favicon                        |       If disabled, the pane will not show the favicon, but only the text.                                                                                                                                                                            |     boolean                                  |        true                |
|        Cache mode                         |        Choose cache mode for saving favicons. This will only take effect when show favicon is set to  `true`. See more [details](#about-cache-mode).                                                                                                                                    |     disk cache, memory cache                 |        disk cache          |
|      Notice mode                          |      You can customize the type of notifications when URL parsing finishes.                                                                                                                                                                          |     none, successful, failed, both&nbsp;     |      both                  |  

## Details

### Supported URL formats

```md
https://example.org
[Alias](https://example.org)
[](https://example.org)
```

### REST API used
If you enable `Show favicon` or disable `Use alias` in the plugin settings, the plugin will use the free [MicroLink API](https://microlink.io) (`https://api.microlink.io?url=`) to request URL metadata, but there is a limitation: 50 requests/day. Don't worry, the plugin will cache the metadata to avoid repeated requests of same URLs.

Note that it takes a certain amount of time to request URL metadata (depending on the number of URLs in the note). During this period, you can do other things first. If `Notice mode` isn't set to `none`, there will be a notice when requests are completed.

If you want to display the URL list as soon as possible, it is recommended that you disable `Show favicon` and enable `Use alias`.

### About cache mode
If you want the favicon to appear faste, you may choose `memory cache`, but please note that it may affect the current performance. If you don't care about speed and there are many URLs, it is recommended to choose `disk cache`.

## Thanks

Thanks to the following great plugins for reference and inspiration:
- [joethei/obsidian-link-favicon](https://github.com/joethei/obsidian-link-favicon)
- [Seraphli/obsidian-link-embed](https://github.com/Seraphli/obsidian-link-embed)

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/obsidian-url-display/issues) or [pull request](https://github.com/lin-stephanie/obsidian-url-display/pulls) on obsidian-url-display repository. Thank you in advance for contributing! 

If this plugin adds value for you, I would appreciate if you could give this repository a star. 😊

