import express from "express";
import { createRouter } from "./src/routers/router";
import { init } from "./src/controllers/controller";
import dotenv from "dotenv"
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const router = createRouter();
app.use(express.json());
app.use("/webhook", router);

app.listen(PORT, async () => {
    console.log(`Bot started...`);
    await init();
});