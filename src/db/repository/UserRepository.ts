import { myDataSource } from '../db';
import { User } from '../entity/User';

export const UserRepository = myDataSource.getRepository(User).extend({
    async getUser(id: number) {
        const user = await this.findOneBy({ id });
        return user;
    },
    async createUser(user: object) {
        await this.save(this.create(user));
    },
});