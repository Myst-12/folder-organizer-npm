// Run with: node examples/basic.js <folder>
const organize = require("../index")

async function main() {
    const folder = process.argv[2] || "hi"

    // first see what would happen
    const plan = await organize(folder, { preview: true })
    console.log(`Preview: ${plan.total} files would be moved`, plan.categories)

    // then actually move the files
    const result = await organize(folder)
    console.log(`Moved ${result.moved} of ${result.total} files`)
    console.log(result.categories)
}

main().catch(err => console.log("Error:", err.message))
