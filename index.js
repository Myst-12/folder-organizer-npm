const fs = require("fs")
const path = require("path")

const categories = {
    Images: [".jpg", ".jpeg", ".png", ".webp"],
    Documents: [".pdf", ".docx", ".txt"],
    Videos: [".mp4", ".mkv", ".mov"],
    Code: [".js", ".py", ".html", ".css"]
}

function organize(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.log("Error reading folder:", err.message)
            return
        }

        files.forEach(file => {
            const extension = path.extname(file).toLowerCase()

            for (const category in categories) {
                if (categories[category].includes(extension)) {
                    const folder = path.join(folderPath, category)

                    fs.mkdir(folder, { recursive: true }, (err) => {
                        if (err) {
                            console.log("Error creating folder:", err.message)
                            return
                        }

                        console.log(`${category} folder ready`)
                    })

                    break
                }
            }
        })
    })
}

module.exports = organize