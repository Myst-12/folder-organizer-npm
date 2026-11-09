#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const organize = require("../index")

const help = `
Usage: folder-organiser <folder> [options]

Sorts the files in <folder> into category folders (Images, Documents, ...)

Options:
  --preview        show what would be moved, without moving anything
  --rules <file>   use your own categories from a JSON file
  --help           show this help
  --version        show the version

Examples:
  npx folder-organiser ./Downloads
  npx folder-organiser ./Downloads --preview
  npx folder-organiser ./Downloads --rules my-rules.json
`

function readRules(rulesFile) {
    try {
        return JSON.parse(fs.readFileSync(rulesFile, "utf8"))
    } catch (err) {
        throw new Error(`Could not read rules file ${rulesFile}: ${err.message}`)
    }
}

async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(help)
        return
    }

    if (args.includes("--version") || args.includes("-v")) {
        console.log(require("../package.json").version)
        return
    }

    const options = { preview: args.includes("--preview") }

    const rulesIndex = args.indexOf("--rules")
    if (rulesIndex !== -1) {
        if (!args[rulesIndex + 1]) {
            throw new Error("--rules needs a JSON file, like --rules my-rules.json")
        }
        options.rules = readRules(args[rulesIndex + 1])
    }

    // the folder is the first argument that is not an option
    // (and not the JSON file that comes right after --rules)
    const folder = args.find((arg, i) => {
        const isRulesFile = rulesIndex !== -1 && i === rulesIndex + 1
        return !arg.startsWith("-") && !isRulesFile
    })
    if (!folder) {
        throw new Error("Please give a folder, like: folder-organiser ./Downloads")
    }

    const result = await organize(path.resolve(folder), options)

    for (const file of result.files) {
        const renamed = file.newName !== file.file ? ` (renamed to ${file.newName})` : ""
        console.log(`${file.file} -> ${file.category}/${renamed}`)
    }

    if (result.total === 0) {
        console.log("No files to organise.")
    } else if (result.preview) {
        console.log(`\nPreview: ${result.total} files would be moved. Nothing was changed.`)
    } else {
        console.log(`\nDone: moved ${result.moved} of ${result.total} files.`)
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exitCode = 1
})
