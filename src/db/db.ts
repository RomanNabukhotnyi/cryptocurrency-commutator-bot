import { DataSource } from 'typeorm';

import { User } from './entity/user.entity';

export const myDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User],
    synchronize: true,
});