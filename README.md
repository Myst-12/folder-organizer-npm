# folder-organiser

Automatically sort the files in a folder into category folders (Images, Documents, Videos, Code, Others) based on their file extension.

Use it from your own Node.js code, or straight from the terminal with `npx`.

```
Downloads/                      Downloads/
├── photo.jpg                   ├── Images/
├── notes.pdf                   │   └── photo.jpg
├── movie.mp4        ──────►    ├── Documents/
├── app.js                      │   └── notes.pdf
└── archive.zip                 ├── Videos/
                                │   └── movie.mp4
                                ├── Code/
                                │   └── app.js
                                └── Others/
                                    └── archive.zip
```

## Why?

Folders like `Downloads` or `Desktop` fill up quickly with a mix of photos, PDFs, videos and random files. Sorting them by hand is slow and boring.

`folder-organiser` does it in one command, and it is built to be **safe** to run on real folders:

- **Preview mode** shows exactly what will happen before anything is moved.
- **Never overwrites files.** If `Images/photo.jpg` already exists, the new file becomes `photo (1).jpg`.
- **Leaves folders and hidden files alone**, such as `.DS_Store`.
- **Custom categories**, so you can sort files your own way (for example a `College` folder for `.pptx` and `.docx`).
- **No dependencies**, only Node's built-in `fs` and `path`.

## Installation

Requires **Node.js 18 or newer**.

To use it in your project:

```bash
npm install folder-organiser
```

To use it as a terminal command without installing anything:

```bash
npx folder-organiser ./Downloads
```

Or install the command globally:

```bash
npm install -g folder-organiser
```

## Basic usage

### In JavaScript

```js
const organize = require("folder-organiser")

async function main() {
    const result = await organize("./Downloads")
    console.log(`Moved ${result.moved} files`)
}

main()
```

### In the terminal

```bash
# organise a folder
npx folder-organiser ./Downloads

# only show what would happen, do not move anything
npx folder-organiser ./Downloads --preview

# use your own categories from a JSON file
npx folder-organiser ./Downloads --rules my-rules.json
```

Example output:

```
photo.jpg -> Images/
notes.pdf -> Documents/
photo.png -> Images/ (renamed to photo (1).png)
archive.zip -> Others/

Done: moved 4 of 4 files.
```

## API

### `organize(folderPath, options)`

Sorts the files directly inside `folderPath` into category folders.

#### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `folderPath` | `string` | Yes | Path to the folder to organise. Can be relative or absolute. |
| `options` | `object` | No | Extra settings, see below. |
| `options.preview` | `boolean` | No | If `true`, nothing is moved. You only get back what *would* happen. Default: `false`. |
| `options.rules` | `object` | No | Your own categories, like `{ College: [".pptx", ".docx"] }`. These **replace** the default categories. Default: see [Default categories](#default-categories). |

Extensions in `rules` can be written as `".png"`, `"png"` or `"PNG"`. They are all treated the same.

#### Return value

Returns a `Promise` that resolves, once every file has been moved, to an object like this:

```js
{
    total: 5,          // number of files found
    moved: 5,          // number of files actually moved (always 0 in preview mode)
    skipped: 2,        // folders, shortcuts and hidden files that were left alone
    preview: false,    // whether this was a preview
    categories: {      // how many files went into each category
        Images: 2,
        Documents: 1,
        Code: 1,
        Others: 1
    },
    files: [           // every file and where it went
        { file: "photo.jpg", category: "Images", newName: "photo.jpg" },
        { file: "pic.jpg", category: "Images", newName: "pic (1).jpg" },
        ...
    ]
}
```

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Number of files that were organised (or would be, in preview). |
| `moved` | `number` | Number of files actually moved. `0` in preview mode. |
| `skipped` | `number` | Number of entries that were left alone: folders, shortcuts and hidden files. |
| `preview` | `boolean` | `true` if this was a preview run. |
| `categories` | `object` | Count of files for each category. Only categories that got at least one file are listed. |
| `files` | `array` | One entry per file: the original name `file`, its `category`, and `newName`, which is different from `file` only if the file had to be renamed to avoid overwriting another file. |

#### Errors

The promise is rejected with an `Error` when:

| Situation | Error message |
|---|---|
| `folderPath` is missing or empty | `folderPath must be a non-empty string` |
| The folder does not exist | `Folder not found: <path>` |
| The path is a file, not a folder | `Not a folder: <path>` |
| `rules` is not an object | `rules must be an object like { Images: [".jpg"] }` |
| A category in `rules` is not an array | `rules.<name> must be an array of extensions` |

```js
try {
    await organize("./does-not-exist")
} catch (err) {
    console.log(err.message) // Folder not found: ./does-not-exist
}
```

### `organize.defaultRules`

The default categories, in case you want to build on them instead of replacing them:

```js
const organize = require("folder-organiser")

await organize("./Downloads", {
    rules: {
        ...organize.defaultRules,
        Music: [".mp3", ".wav"]
    }
})
```

## Default categories

| Folder | Extensions |
|---|---|
| `Images` | `.jpg` `.jpeg` `.png` `.webp` |
| `Documents` | `.pdf` `.docx` `.txt` |
| `Videos` | `.mp4` `.mkv` `.mov` |
| `Code` | `.js` `.py` `.html` `.css` |
| `Others` | anything else, including files with no extension |

## Command line

```
Usage: folder-organiser <folder> [options]

Options:
  --preview        show what would be moved, without moving anything
  --rules <file>   use your own categories from a JSON file
  --help           show this help
  --version        show the version
```

A rules file is plain JSON in the same format as `options.rules`:

```json
{
    "Images": [".jpg", ".jpeg", ".png"],
    "Documents": [".pdf", ".txt"],
    "College": [".pptx", ".docx"],
    "Music": [".mp3", ".wav"]
}
```

If something goes wrong (for example the folder does not exist), the command prints an error and exits with code `1`.

## Examples

### Preview first, then organise

```js
const organize = require("folder-organiser")

async function main() {
    const plan = await organize("./Downloads", { preview: true })

    for (const file of plan.files) {
        console.log(`${file.file} would go to ${file.category}/`)
    }

    // happy with it? now really move the files
    await organize("./Downloads")
}

main()
```

### Custom categories for college work

```js
await organize("./Downloads", {
    rules: {
        Images: [".jpg", ".png"],
        Documents: [".pdf", ".txt"],
        College: [".pptx", ".docx"]
    }
})
```

Any file whose extension is not in your rules goes to `Others`.

### Print a summary

```js
const result = await organize("./Downloads")

console.log(`Moved ${result.moved} of ${result.total} files`)
for (const category in result.categories) {
    console.log(`${category}: ${result.categories[category]}`)
}
```

More examples are in the [`examples/`](examples) folder.

## How it works

1. Checks that the path exists and is a folder.
2. Reads the entries directly inside it.
3. Skips anything that is not a normal file (folders, shortcuts) and hidden files starting with `.`.
4. Looks up each file's extension in the rules to find its category. If there is no match, the category is `Others`.
5. Creates the category folder if needed and moves the file into it. If a file with the same name is already there, it adds `(1)`, `(2)` and so on to the name.
6. Returns the statistics once every file has been handled.

## Limitations

- **Only the top level is organised.** Files inside subfolders are not touched.
- **Sorting is by extension only.** The file's contents are not checked, so a `.jpg` that is really a PDF still goes to `Images`.
- **There is no undo.** Use `--preview` / `{ preview: true }` first if you are unsure.
- **Files are moved one at a time**, which is safe but slower for folders with many thousands of files.
- **Hidden files** (names starting with `.`) are always skipped.
- If an extension appears in more than one category in your rules, the first category wins.
- If you run it while another program is adding or removing files in the same folder, the results may not be exact.

## Running the tests

The tests use Node's built-in test runner, so nothing extra needs to be installed:

```bash
npm test
```

Every test runs in its own temporary folder, so your real files are never touched.

## Contributing

Contributions are welcome!

1. Fork the repository and clone your fork.
2. Create a branch: `git checkout -b my-feature`
3. Make your change and add a test for it in `test/`.
4. Make sure `npm test` passes.
5. Commit, push and open a pull request describing what you changed and why.

Found a bug or have an idea? Please [open an issue](https://github.com/Myst-12/folder-organizer-npm/issues).

## License

MIT
