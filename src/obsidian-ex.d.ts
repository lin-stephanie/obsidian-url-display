import 'obsidian';

declare module 'obsidian' {
    interface Workspace {
        getActiveFileView(): FileView;
    }
}
