import { Router } from 'express';

import { Controller } from '../controllers/controller';

export const createRouter = () => {
    const router = Router();
    router.post(`/${process.env.TOKEN}`, Controller.post);
    return router;
};