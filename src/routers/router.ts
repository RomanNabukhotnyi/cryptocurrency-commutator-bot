import { Router } from "express";
import { controller } from "../controllers/controller"
import dotenv from "dotenv"
dotenv.config();
export const createRouter = () => {
    const router = Router();
    router.post(`/${process.env.TOKEN}`, controller.post);
    return router;
}