/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { Request, Response } from "express";
import { db } from "../db";
import axios from "axios";
import dotenv from "dotenv"
dotenv.config();

const { TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

export const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    await axios.post(`${TELEGRAM_API}/setMyCommands`, {
        commands: [
            { command: "/start", description: "welcome message" },
            { command: "/help", description: "brief information about the bot and its list of commands" },
            { command: "/list_recent", description: "list of hype cryptos" },
            { command: "/add_to_favorite", description: "add crypto to favorites" },
            { command: "/list_favorite", description: "list of favorite cryptos" },
            { command: "/delete_favorite", description: "delete crypto from favorites" }
        ]
    })
    console.log(res.data);
}

const sendMessage = async (chat_id: number, text: string, reply_markup?: object) => {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id,
        text,
        reply_markup
    })
}

export class controller {
    static async post(req: Request, res: Response) {
        const chatId = req.body.callback_query?.message.chat.id ?? req.body.message.chat.id;
        const text: string = req.body.message?.text ?? req.body.callback_query.data;
        switch (true) {
            case text == "/start":
                await sendMessage(chatId, "Hello");
                break;
            case text == "/help":
                const response = await axios.get(`${TELEGRAM_API}/getMyCommands`);
                let commands = "";
                response.data.result.forEach((el: any) => {
                    commands += `\n/${el.command} - ${el.description}`;
                });
                await sendMessage(chatId, "This is a telegram bot that helps manage cryptocurrency." + commands);
                break;
            case text == "/list_recent":
                db.query("SELECT * FROM coins;", async (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let coins = "";
                    rows.forEach((el: any) => {
                        coins += `\n/${el.cryptocurrensyName} $${((el.coinMarketCapValue + el.coinBaseValue + el.coinStatsValue + el.kucoinValue + el.coinPaprikaValue) / 5).toFixed(6)}`;
                    });
                    await sendMessage(chatId, "List recent:" + coins);
                });
                break;
            case text == "/list_favorite":
                db.query("SELECT * FROM favorite WHERE id = ?;", [chatId], async (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    const favoriteCryptos: any = rows[0]?.favoriteCryptos;
                    let favorite = "";
                    if (favoriteCryptos && favoriteCryptos != "[]") {
                        JSON.parse(favoriteCryptos).forEach(async (el: any) => {
                            db.query("SELECT * FROM coins WHERE cryptocurrensyName = ?;", [el], async (err, rows) => {
                                if (err) {
                                    throw err;
                                }
                                const coin = rows[0];
                                favorite = favorite + `\n/${coin.cryptocurrensyName} $${((coin.coinMarketCapValue + coin.coinBaseValue + coin.coinStatsValue + coin.kucoinValue + coin.coinPaprikaValue) / 5).toFixed(6)}`;
                                await sendMessage(chatId, "List favorite:" + favorite);
                            });
                        })
                    } else {
                        await sendMessage(chatId, "List favorite:" + "\nEmpty");
                    }
                })
                break;
            case /\/[A-Z]+/.test(text):
                let coin = "";
                db.query("SELECT * FROM coins;", (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    rows.forEach((el: any) => {
                        if (text.replace("/", "") == el.cryptocurrensyName)
                            coin = `${el.cryptocurrensyName}\n\
                            CoinMarketCap price: $${el.coinMarketCapValue}\n\
                            CoinBase price: $${el.coinBaseValue}\n\
                            CoinStatsCap price: $${el.coinStatsValue}\n\
                            Kucoin price: $${el.kucoinValue}\n\
                            CoinPaprika price: $${el.coinPaprikaValue}`;
                    });
                });
                db.query("SELECT * FROM favorite WHERE id = ?;", [chatId], async (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    const favoriteCryptos: any[] = rows[0]?.favoriteCryptos;
                    const keyboard = favoriteCryptos?.includes((text.replace("/", ""))) ? [{ text: "Delete from favorite", callback_data: `/delete_favorite ${text.replace("/", "")}` }] : [{ text: "Add to favorite", callback_data: `/add_to_favorite ${text.replace("/", "")}` }];
                    await sendMessage(chatId, coin, { inline_keyboard: [keyboard] });
                })
                break;
            case /(\/add_to_favorite)\s([A-Z]+)/.test(text):
                db.query("SELECT * FROM favorite WHERE id = ?;", [chatId], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    const favoriteCryptos: any = rows[0]?.favoriteCryptos;
                    if (favoriteCryptos) {
                        db.query("UPDATE favorite SET favoriteCryptos = ? WHERE id = ?;", [JSON.stringify([...JSON.parse(favoriteCryptos), text.replace("/add_to_favorite ", "")]), chatId], (err) => {
                            if (err) {
                                throw err;
                            }
                        });
                    } else {
                        const body = {
                            id: chatId,
                            favoriteCryptos: JSON.stringify([text.replace("/add_to_favorite ", "")])
                        }
                        db.query("INSERT INTO favorite SET ?;", [body], (err) => {
                            if (err) {
                                throw err;
                            }
                        });
                    }
                });
                break;
            case /(\/delete_favorite)\s([A-Z]+)/.test(text):
                db.query("SELECT * FROM favorite WHERE id = ?;", [chatId], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let favoriteCryptos: any[] = JSON.parse(rows[0]?.favoriteCryptos);
                    favoriteCryptos = favoriteCryptos.filter((coin) => { return coin != text.replace("/delete_favorite ", "") });
                    db.query("UPDATE favorite SET favoriteCryptos = ? WHERE id = ?;", [JSON.stringify(favoriteCryptos), chatId], (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                });
                break;
            default:
                break;
        }
        return res.send();
    }
}