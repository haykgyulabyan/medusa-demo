import express from "express"
import cors from "cors"
import { cartRouter } from "./routes/cart-routes.js"
import { seed } from "./seed/seed.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use("/api", cartRouter)

seed()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
