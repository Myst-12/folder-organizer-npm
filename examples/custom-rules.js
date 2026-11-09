// Run with: node examples/custom-rules.js <folder>
const organize = require("../index")

async function main() {
    const folder = process.argv[2] || "hi"

    const result = await organize(folder, {
        preview: true,
        rules: {
            Images: [".jpg", ".png"],
            Documents: [".pdf", ".txt"],
            College: [".pptx", ".docx"]
        }
    })

    for (const file of result.files) {
        console.log(`${file.file} would go to ${file.category}/`)
    }
}

main().catch(err => console.log("Error:", err.message))
