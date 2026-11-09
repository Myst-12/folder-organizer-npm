const test = require("node:test")
const assert = require("node:assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const organize = require("../index")

// makes a fresh temporary folder with the given empty files inside
function makeFolder(fileNames) {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "organiser-test-"))
    for (const name of fileNames) {
        fs.writeFileSync(path.join(folder, name), "")
    }
    return folder
}

function existsIn(folder, ...parts) {
    return fs.existsSync(path.join(folder, ...parts))
}

test("moves files into the default category folders", async () => {
    const folder = makeFolder(["photo.jpg", "notes.pdf", "movie.mp4", "app.js", "archive.zip"])

    await organize(folder)

    assert.ok(existsIn(folder, "Images", "photo.jpg"))
    assert.ok(existsIn(folder, "Documents", "notes.pdf"))
    assert.ok(existsIn(folder, "Videos", "movie.mp4"))
    assert.ok(existsIn(folder, "Code", "app.js"))
    assert.ok(existsIn(folder, "Others", "archive.zip"))
    assert.ok(!existsIn(folder, "photo.jpg"))
})

test("extensions are matched without caring about uppercase", async () => {
    const folder = makeFolder(["PHOTO.JPG", "Report.Pdf"])

    await organize(folder)

    assert.ok(existsIn(folder, "Images", "PHOTO.JPG"))
    assert.ok(existsIn(folder, "Documents", "Report.Pdf"))
})

test("files without an extension go to Others", async () => {
    const folder = makeFolder(["README"])

    await organize(folder)

    assert.ok(existsIn(folder, "Others", "README"))
})

test("preview mode does not move anything", async () => {
    const folder = makeFolder(["photo.jpg", "notes.txt"])

    const result = await organize(folder, { preview: true })

    assert.ok(existsIn(folder, "photo.jpg"))
    assert.ok(existsIn(folder, "notes.txt"))
    assert.ok(!existsIn(folder, "Images"))
    assert.strictEqual(result.preview, true)
    assert.strictEqual(result.moved, 0)
    assert.strictEqual(result.total, 2)
})

test("returns correct statistics", async () => {
    const folder = makeFolder(["a.jpg", "b.png", "c.pdf", "d.js", "e.zip"])

    const result = await organize(folder)

    assert.strictEqual(result.total, 5)
    assert.strictEqual(result.moved, 5)
    assert.strictEqual(result.skipped, 0)
    assert.deepStrictEqual(result.categories, { Images: 2, Documents: 1, Code: 1, Others: 1 })
    assert.strictEqual(result.files.length, 5)
})

test("an empty folder returns zero counts", async () => {
    const folder = makeFolder([])

    const result = await organize(folder)

    assert.deepStrictEqual(result, {
        total: 0,
        moved: 0,
        skipped: 0,
        preview: false,
        categories: {},
        files: []
    })
})

test("custom rules replace the default categories", async () => {
    const folder = makeFolder(["slides.pptx", "essay.docx", "photo.jpg"])

    const result = await organize(folder, {
        rules: { College: [".pptx", ".docx"] }
    })

    assert.ok(existsIn(folder, "College", "slides.pptx"))
    assert.ok(existsIn(folder, "College", "essay.docx"))
    // .jpg is not in the custom rules, so it goes to Others
    assert.ok(existsIn(folder, "Others", "photo.jpg"))
    assert.deepStrictEqual(result.categories, { College: 2, Others: 1 })
})

test("custom rules accept extensions without a dot or in uppercase", async () => {
    const folder = makeFolder(["song.mp3", "track.wav"])

    await organize(folder, { rules: { Music: ["MP3", "wav"] } })

    assert.ok(existsIn(folder, "Music", "song.mp3"))
    assert.ok(existsIn(folder, "Music", "track.wav"))
})

test("does not overwrite a file that already exists", async () => {
    const folder = makeFolder(["photo.jpg"])
    fs.mkdirSync(path.join(folder, "Images"))
    fs.writeFileSync(path.join(folder, "Images", "photo.jpg"), "old")
    fs.writeFileSync(path.join(folder, "Images", "photo (1).jpg"), "old")

    const result = await organize(folder)

    assert.strictEqual(fs.readFileSync(path.join(folder, "Images", "photo.jpg"), "utf8"), "old")
    assert.ok(existsIn(folder, "Images", "photo (2).jpg"))
    assert.strictEqual(result.files[0].newName, "photo (2).jpg")
})

test("skips folders and hidden files", async () => {
    const folder = makeFolder(["photo.jpg", ".DS_Store"])
    fs.mkdirSync(path.join(folder, "My Folder"))

    const result = await organize(folder)

    assert.ok(existsIn(folder, ".DS_Store"))
    assert.ok(existsIn(folder, "My Folder"))
    assert.strictEqual(result.total, 1)
    assert.strictEqual(result.skipped, 2)
})

test("running twice does not move already organised files", async () => {
    const folder = makeFolder(["photo.jpg"])

    await organize(folder)
    const second = await organize(folder)

    assert.strictEqual(second.total, 0)
    assert.ok(existsIn(folder, "Images", "photo.jpg"))
})

test("throws for a folder that does not exist", async () => {
    await assert.rejects(
        organize(path.join(os.tmpdir(), "this-folder-does-not-exist-123")),
        /Folder not found/
    )
})

test("throws when the path is a file, not a folder", async () => {
    const folder = makeFolder(["photo.jpg"])

    await assert.rejects(organize(path.join(folder, "photo.jpg")), /Not a folder/)
})

test("throws for an empty or missing path", async () => {
    await assert.rejects(organize(""), /non-empty string/)
    await assert.rejects(organize(), /non-empty string/)
})

test("throws for invalid rules", async () => {
    const folder = makeFolder([])

    await assert.rejects(organize(folder, { rules: [] }), /rules must be an object/)
    await assert.rejects(organize(folder, { rules: { Images: ".jpg" } }), /must be an array/)
})
