# Custom New Tab

A simple start page to replace the default tab in your browser. It shows the time, some quick links, and picks a random photo from your local folders every time you open it.

## Files overview

| File | Role |
|------|------|
| `index.html` | Main page |
| `styles.css` | Styles |
| `scripts.js` | Logic (clock, links, drag & drop, modals) |
| `api.php` | REST API to manage links (add, edit, delete, reorder) |
| `links.json` | Links database (auto-managed by the API) |
| `config.json` | Configuration (photo directories) |
| `random-image.php` | Picks and serves a random photo |

## How to make it yours

### Links

Links are managed dynamically via the interface — no need to edit HTML.

- Click the ✏️ button to enter **edit mode**
- Click **+** on any row to add a link (URL + icon + label)
- Click the ✎ icon on a link to edit or delete it
- **Drag and drop** links to reorder them, or move them to another row

Links are stored in `links.json` and updated automatically by `api.php`.

### Photos

Open `config.json` and set your local photo folders:

```json
{
  "photo_directories": [
    "C:/Users/Pictures/2025",
    "C:/Users/Pictures/2024"
  ]
}
```

`random-image.php` reads this file and serves a random image from those folders each time the page loads.

### Run it

This project requires a local PHP server (e.g. [XAMPP](https://www.apachefriends.org/) or [WampServer](https://www.wampserver.com/)).

1. Place the project folder in your server's web root (e.g. `htdocs/newtab`)
2. Point your browser's "New Tab" extension to `http://localhost/newtab`

## Tips

**Open apps directly from a link** — use protocol URLs:

```
steam://open/main
```

Works with any app that registers a custom URL protocol.
