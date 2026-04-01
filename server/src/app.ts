import express from "express"
import cors from "cors"
import { cartRouter } from "./routes/cart-routes.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api", cartRouter)

export default app
