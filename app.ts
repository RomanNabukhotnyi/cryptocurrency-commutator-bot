import express from 'express';
import 'dotenv/config';

import { createRouter } from './src/routers/router';
import { myDataSource } from './src/db/db';
import { init } from './src/controllers/command';

const PORT = process.env.PORT || 3000;

const app = express();
const router = createRouter();
app.use(express.json());
app.use('/webhook', router);

app.listen(PORT, async () => {
    console.log('Bot started...');
    await myDataSource
        .initialize()
        .then(() => {
            console.log('Data Source has been initialized!');
        })
        .catch((err) => {
            console.error('Error during Data Source initialization:', err);
        });
    await init();
});