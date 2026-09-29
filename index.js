const fs = require("fs")
const path = require("path")

const categories ={
    Images: [".jpg", ".jpeg", ".png", ".webp"],
    Documents: [".pdf", ".docx", ".txt"],
    Videos: [".mp4", ".mkv", ".mov"],
    Code: [".js", ".py", ".html", ".css"]
}

function organize(folderPath){
    fs.readdir(folderPath, (err, files) => {
        if(err){
            console.log("Error reading folder:", err.message)
            return
        }

        files.forEach(file =>{
            const extension = path.extname(file).toLowerCase()

            for (const category in categories){
                if (categories[category].includes(extension)){
                    console.log(`${file} -> ${category}`)
                    break
                }
            }
        })
    })
}

module.exports = organize