const organize = require("./index")

async function main() {
    // first see what would happen
    await organize("hi", { preview: true })

    // then actually move the files
    await organize("hi")
}

main().catch(err => console.log("Error:", err.message))
