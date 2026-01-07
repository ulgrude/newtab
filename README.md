# My Custom New Tab

Just a simple start page to replace the default tab from your favorite web browser. It shows the time, some quick links, and picks a random photo from your local folders every time you open it.

## How to make it yours

This isn't a "one size fits all" app. It's meant to be modified!

1.  **Change the Links ([index.html](https://github.com/ulgrude/newtab/blob/main/index.html))**: 
    The links included (YouTube, Reddit, etc.) are just an example. 
    *   Edit the `<a>` tags to point to your favorite sites.
    *   Swap the icons in the `img/` folder with whatever matches your theme.

2.  **Set your Photos ([random-image.php](https://github.com/ulgrude/newtab/blob/main/random-image.php))**:
    This script looks through local folders to find images.
    *   Open [random-image.php](https://github.com/ulgrude/newtab/blob/main/random-image.php).
    *   Change the `$rootDirectories` to point to **your** photo folders on your hard drive.

3.  **Run it**:
    Since it uses PHP to read files, you need to host this on a local server (like XAMPP or WampServer). Point your browser's "New Tab" extension to `localhost/your-folder`.

## A cool trick: App Links
Check out the **Steam** link in the HTML:
```html
<a href="steam://open/main"> ... </a>
