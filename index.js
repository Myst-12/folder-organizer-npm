const fs = require("fs/promises")
const path = require("path")

const categories = {
    Images: [".jpg", ".jpeg", ".png", ".webp"],
    Documents: [".pdf", ".docx", ".txt"],
    Videos: [".mp4", ".mkv", ".mov"],
    Code: [".js", ".py", ".html", ".css"]
}

function getCategory(fileName) {
    const extension = path.extname(fileName).toLowerCase()

    for (const category in categories) {
        if (categories[category].includes(extension)) {
            return category
        }
    }

    return "Others"
}

async function organize(folderPath, options = {}) {
    const preview = options.preview === true
    const files = await fs.readdir(folderPath, { withFileTypes: true })
    const moves = []

    for (const file of files) {
        if (file.isDirectory()) {
            continue
        }

        const fileName = file.name
        const category = getCategory(fileName)

        // in preview mode we only record the move, nothing is touched
        if (!preview) {
            const folder = path.join(folderPath, category)
            await fs.mkdir(folder, { recursive: true })
            await fs.rename(path.join(folderPath, fileName), path.join(folder, fileName))
        }

        moves.push({ file: fileName, category: category })
        console.log(`${preview ? "[preview] " : ""}${fileName} -> ${category}`)
    }

    return moves
}

module.exports = organize
