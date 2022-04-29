import { Request, Response } from 'express';

import { Command } from './command';

export class Controller {
    static async post(req: Request, res: Response) {
        const chatId = req.body.callback_query?.message.chat.id ?? req.body.message.chat.id;
        const text: string = req.body.message?.text ?? req.body.callback_query.data;
        switch (true) {
            case text == '/start':
                await Command.start(chatId);
                break;
            case text == '/help':
                await Command.help(chatId);
                break;
            case text == '/list_recent':
                await Command.listRecent(chatId);
                break;
            case text == '/list_favorite':
                await Command.listFavorite(chatId);
                break;
            case /\/[A-Z]+/.test(text):
                await Command.coinInfo(chatId, text.replace('/', ''));
                break;
            case /(\/add_to_favorite)\s([A-Z]+)/.test(text):
                await Command.addToFavorite(chatId, text.replace('/add_to_favorite ', ''));
                break;
            case /(\/delete_favorite)\s([A-Z]+)/.test(text):
                await Command.deleteFavorite(chatId, text.replace('/delete_favorite ', ''));
                break;
            default:
                break;
        }
        return res.send();
    }
}