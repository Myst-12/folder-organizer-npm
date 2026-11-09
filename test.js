const organize = require("./index")

async function main() {
    // first see what would happen
    const plan = await organize("hi", { preview: true })
    console.log(plan)

    // then actually move the files
    const result = await organize("hi")
    console.log(`Moved ${result.moved} of ${result.total} files`)
    console.log(result.categories)
}

main().catch(err => console.log("Error:", err.message))
