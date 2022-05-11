import axios from 'axios';

import { UserRepository } from '../db/repository/UserRepository';
import { ICoin } from '../interfaces/ICoin';
import { ICommand } from '../interfaces/ICommand';

const { TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

export const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    await axios.post(`${TELEGRAM_API}/setMyCommands`, {
        commands: [
            { command: '/start', description: 'welcome message' },
            { command: '/help', description: 'brief information about the bot and its list of commands' },
            { command: '/list_recent', description: 'list of hype cryptos' },
            { command: '/add_to_favorite', description: 'add crypto to favorites' },
            { command: '/list_favorite', description: 'list of favorite cryptos' },
            { command: '/delete_favorite', description: 'delete crypto from favorites' },
        ],
    });
    console.log(res.data);
};

const sendMessage = async (chat_id: number, text: string, reply_markup?: object) => {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id,
        text,
        reply_markup,
    });
};

export class Command {
    static async start(chatId: number) {
        await sendMessage(chatId, 'Hello');
    }

    static async help(chatId: number) {
        const commands = await axios.get<{ result: ICommand[]; }>(`${TELEGRAM_API}/getMyCommands`).then(res => res.data);
        let listCommands = '';
        commands.result.forEach((el) => {
            listCommands += `\n/${el.command} - ${el.description}`;
        });
        await sendMessage(chatId, 'This is a telegram bot that helps manage cryptocurrency.' + listCommands);
    }

    static async listRecent(chatId: number) {
        const recent = await axios.get<ICoin[]>(String(process.env.SERVER)).then(res => res.data);
        let listRecent = '';
        recent.forEach((el) => {
            let price = (el.coinMarketCapValue + el.coinBaseValue + el.coinStatsValue + el.kucoinValue + el.coinPaprikaValue) / 5;
            listRecent += `\n/${el.cryptocurrensyName} $${price.toFixed(6)}`;
        });
        await sendMessage(chatId, 'List recent:' + listRecent);
    }

    static async listFavorite(chatId: number) {
        const user = await UserRepository.getUser(chatId);
        if (user && user.favoriteCryptos.length != 0) {
            const favoriteCryptos = user.favoriteCryptos;
            let listFavorite = '';
            for (const crypto of favoriteCryptos) {
                const coin = await axios.get<ICoin>(process.env.SERVER + crypto).then(res => res.data);
                let price = (coin.coinMarketCapValue + coin.coinBaseValue + 
                            coin.coinStatsValue + coin.kucoinValue + coin.coinPaprikaValue) / 5;
                listFavorite += `\n/${coin.cryptocurrensyName} $${price.toFixed(6)}`;
            }
            await sendMessage(chatId, 'List favorite:' + listFavorite);
        } else {
            await sendMessage(chatId, 'List favorite:' + '\nEmpty');
        }
    }

    static async coinInfo(chatId: number, coinName: string) {
        const coin = await axios.get<ICoin>(process.env.SERVER + coinName).then(res => res.data);
        if (coin) {
            const cryptoInfo = `${coin.cryptocurrensyName}\n\
            CoinMarketCap price: $${coin.coinMarketCapValue}\n\
            CoinBase price: $${coin.coinBaseValue}\n\
            CoinStatsCap price: $${coin.coinStatsValue}\n\
            Kucoin price: $${coin.kucoinValue}\n\
            CoinPaprika price: $${coin.coinPaprikaValue}`;
            const user = await UserRepository.getUser(chatId);
            const keyboard = user?.favoriteCryptos.includes(coinName) 
                ? [{ text: 'Delete from favorite', callback_data: `/delete_favorite ${coinName}` }] 
                : [{ text: 'Add to favorite', callback_data: `/add_to_favorite ${coinName}` }];
            await sendMessage(chatId, cryptoInfo, { inline_keyboard: [keyboard] });
        } else {
            await sendMessage(chatId, `No cryptocurrencies named "${coinName}" found`);
        }
    }

    static async addToFavorite(chatId: number, coinName: string | undefined) {
        if (coinName) {
            const coin = await axios.get<ICoin>(encodeURI(process.env.SERVER + coinName)).then(res => res.data);
            if (coin) {
                const user = await UserRepository.getUser(chatId);
                if (user) {
                    if (!user.favoriteCryptos.includes(coinName)) {
                        user.favoriteCryptos = [...user.favoriteCryptos, coinName];
                        await user.save();
                        await sendMessage(chatId, `${coinName} successfully added`);
                    } else {
                        await sendMessage(chatId, `${coinName} is already on your favorites list`);
                    }
                } else {
                    await UserRepository.createUser({ id: chatId, favoriteCryptos: [coinName] });
                    await sendMessage(chatId, `${coinName} successfully added`);
                }
            } else {
                await sendMessage(chatId, `No cryptocurrencies named "${coinName}" found`);
            }
        } else {
            await sendMessage(chatId, 'This command needs a parameter');
        }
    }

    static async deleteFavorite(chatId: number, coinName: string | undefined) {
        if (coinName) {
            const coin = await axios.get<ICoin>(encodeURI(process.env.SERVER + coinName)).then(res => res.data);
            if (coin) {
                const user = await UserRepository.getUser(chatId);
                if (user) {
                    if (user.favoriteCryptos.includes(coinName)) {
                        user.favoriteCryptos = user.favoriteCryptos.filter((c) => { return c != coinName; });
                        await UserRepository.save(user);
                        await sendMessage(chatId, `${coinName} successfully deleted`);
                    } else {
                        await sendMessage(chatId, `${coinName} is not on your favorites list`);
                    }
                }
            } else {
                await sendMessage(chatId, `No cryptocurrencies named "${coinName}" found`);
            }
        } else {
            await sendMessage(chatId, 'This command needs a parameter');
        }
    }
}