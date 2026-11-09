const test = require("node:test")
const assert = require("node:assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { execFileSync, spawnSync } = require("child_process")

const cli = path.join(__dirname, "..", "bin", "cli.js")

function makeFolder(fileNames) {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "organiser-cli-"))
    for (const name of fileNames) {
        fs.writeFileSync(path.join(folder, name), "")
    }
    return folder
}

test("cli organises a folder", () => {
    const folder = makeFolder(["photo.jpg", "notes.txt"])

    const output = execFileSync("node", [cli, folder], { encoding: "utf8" })

    assert.match(output, /moved 2 of 2 files/)
    assert.ok(fs.existsSync(path.join(folder, "Images", "photo.jpg")))
})

test("cli --preview does not move files", () => {
    const folder = makeFolder(["photo.jpg"])

    const output = execFileSync("node", [cli, folder, "--preview"], { encoding: "utf8" })

    assert.match(output, /Preview/)
    assert.ok(fs.existsSync(path.join(folder, "photo.jpg")))
})

test("cli --rules reads categories from a JSON file", () => {
    const folder = makeFolder(["slides.pptx"])
    const rulesFile = path.join(os.tmpdir(), `rules-${Date.now()}.json`)
    fs.writeFileSync(rulesFile, JSON.stringify({ College: [".pptx"] }))

    execFileSync("node", [cli, folder, "--rules", rulesFile], { encoding: "utf8" })

    assert.ok(fs.existsSync(path.join(folder, "College", "slides.pptx")))
})

test("cli --help shows usage", () => {
    const output = execFileSync("node", [cli, "--help"], { encoding: "utf8" })

    assert.match(output, /Usage: folder-organiser/)
})

test("cli shows an error and exit code 1 for a bad folder", () => {
    const result = spawnSync("node", [cli, "no-such-folder-123"], { encoding: "utf8" })

    assert.strictEqual(result.status, 1)
    assert.match(result.stderr, /Folder not found/)
})
