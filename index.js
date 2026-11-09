const fs = require("fs/promises")
const path = require("path")

const defaultRules = {
    Images: [".jpg", ".jpeg", ".png", ".webp"],
    Documents: [".pdf", ".docx", ".txt"],
    Videos: [".mp4", ".mkv", ".mov"],
    Code: [".js", ".py", ".html", ".css"]
}

// makes sure every extension is lowercase and starts with a dot
// so users can write "PNG", "png" or ".png"
function cleanRules(rules) {
    if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
        throw new Error("rules must be an object like { Images: [\".jpg\"] }")
    }

    const cleaned = {}

    for (const category in rules) {
        if (!Array.isArray(rules[category])) {
            throw new Error(`rules.${category} must be an array of extensions`)
        }

        cleaned[category] = rules[category].map(ext => {
            ext = String(ext).toLowerCase()
            return ext.startsWith(".") ? ext : "." + ext
        })
    }

    return cleaned
}

function getCategory(fileName, rules) {
    const extension = path.extname(fileName).toLowerCase()

    for (const category in rules) {
        if (rules[category].includes(extension)) {
            return category
        }
    }

    return "Others"
}

async function exists(filePath) {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

// if "photo.jpg" is already there, try "photo (1).jpg", "photo (2).jpg" ...
async function getSafePath(folder, fileName) {
    const extension = path.extname(fileName)
    const baseName = path.basename(fileName, extension)

    let newPath = path.join(folder, fileName)
    let count = 1

    while (await exists(newPath)) {
        newPath = path.join(folder, `${baseName} (${count})${extension}`)
        count++
    }

    return newPath
}

async function checkFolder(folderPath) {
    if (typeof folderPath !== "string" || folderPath.trim() === "") {
        throw new Error("folderPath must be a non-empty string")
    }

    let stats
    try {
        stats = await fs.stat(folderPath)
    } catch {
        throw new Error(`Folder not found: ${folderPath}`)
    }

    if (!stats.isDirectory()) {
        throw new Error(`Not a folder: ${folderPath}`)
    }
}

async function organize(folderPath, options = {}) {
    await checkFolder(folderPath)

    const preview = options.preview === true
    const rules = options.rules ? cleanRules(options.rules) : defaultRules
    const files = await fs.readdir(folderPath, { withFileTypes: true })

    const result = {
        total: 0,
        moved: 0,
        skipped: 0,
        preview: preview,
        categories: {},
        files: []
    }

    for (const file of files) {
        // skip folders, shortcuts and hidden files like .DS_Store
        if (!file.isFile() || file.name.startsWith(".")) {
            result.skipped++
            continue
        }

        result.total++

        const fileName = file.name
        const category = getCategory(fileName, rules)
        const folder = path.join(folderPath, category)
        const newPath = await getSafePath(folder, fileName)
        const newName = path.basename(newPath)

        // in preview mode we only record the move, nothing is touched
        if (!preview) {
            await fs.mkdir(folder, { recursive: true })
            await fs.rename(path.join(folderPath, fileName), newPath)
            result.moved++
        }

        // count how many files go into each category
        result.categories[category] = (result.categories[category] || 0) + 1
        result.files.push({ file: fileName, category: category, newName: newName })

        const renamed = newName !== fileName ? ` (renamed to ${newName})` : ""
        console.log(`${preview ? "[preview] " : ""}${fileName} -> ${category}${renamed}`)
    }

    return result
}

module.exports = organize
