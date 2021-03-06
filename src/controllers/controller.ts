import { Request, Response } from 'express';

import { Command } from './command';

export class Controller {
    static async post(req: Request, res: Response) {
        const chatId = req.body.callback_query?.message.chat.id ?? req.body.message?.chat.id;
        const text: string = req.body.message?.text.trim() ?? req.body.callback_query?.data.trim();
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
            case /\/add_to_favorite/.test(text):
                await Command.addToFavorite(chatId, text.split(/\s+/)[1]?.toUpperCase());
                break;
            case /\/delete_favorite/.test(text):
                await Command.deleteFavorite(chatId, text.split(/\s+/)[1]?.toUpperCase());
                break;
            case /\/[A-Za-z]+/.test(text):
                await Command.coinInfo(chatId, text.replace('/', '').toUpperCase());
                break;
            default:
                break;
        }
        return res.send();
    }
}