const fs = require("fs")
const path = require("path")

const categories = {
    Images: [".jpg", ".jpeg", ".png", ".webp"],
    Documents: [".pdf", ".docx", ".txt"],
    Videos: [".mp4", ".mkv", ".mov"],
    Code: [".js", ".py", ".html", ".css"]
}

function organize(folderPath) {
    fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.log("Error reading folder:", err.message)
            return
        }

        files.forEach(file => {

            if (file.isDirectory()) {
                return
            }

            const fileName = file.name
            const extension = path.extname(fileName).toLowerCase()

            let category = "Others"

            for (const currentCategory in categories) {
                if (categories[currentCategory].includes(extension)) {
                    category = currentCategory
                    break
                }
            }

            const folder = path.join(folderPath, category)
            const oldPath = path.join(folderPath, fileName)
            const newPath = path.join(folder, fileName)

            fs.mkdir(folder, { recursive: true }, (err) => {
                if (err) {
                    console.log("Error creating folder:", err.message)
                    return
                }

                fs.rename(oldPath, newPath, (err) => {
                    if (err) {
                        console.log("Error moving file:", err.message)
                        return
                    }

                    console.log(`${fileName} -> ${category}`)
                })
            })
        })
    })
}

module.exports = organize