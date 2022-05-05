import { myDataSource } from '../db';
import { User } from '../entity/User';

export const UserRepository = myDataSource.getRepository(User);