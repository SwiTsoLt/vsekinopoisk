const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const axios = require('axios').default;
const { getRows } = require("./my_modules/googleAuth")
const { sendUserAnalytic } = require("./my_modules/analytics")

const app = express()
const PORT = process.env.PORT || config.get("PORT")
const TOKEN = process.env.TOKEN || "" 
const bot = new TelegramBot(TOKEN, { polling: true });
const delay = 600000

const regularOptions = {
    start: /\/start/,
    code: /([0-9]+|secret)/,
    help: /\/help/
}

const smileList = ['🍿', '🎥'] 
let smileId = 0

async function start() {

    try {
        await bot.onText(regularOptions.start, async message => {
            await greeting(message)
        })

        await bot.onText(regularOptions.code, async message => {
            try {
                const loadingMessage = await bot.sendMessage(message.chat.id, "Загружаю фильм...")

                const isSubscribe = checkSubscribe(message, loadingMessage)

                if (isSubscribe) {
                    const response = await getRows({ range: "data" })
                    await bot.deleteMessage(message.chat.id, loadingMessage.message_id)
                    const data = formatResponse(response)
                    if (data[message.text]) {
                        sendUserAnalytic(message)
    
                        await bot.sendMessage(message.chat.id, `${smileList[smileId]} ${data[message.text]}`)
                        smileId = smileId === 0 ? 1 : 0
                    } else {
                        await bot.sendMessage(message.chat.id, `Фильм/Сериал по коду '${message.text}' не найден.`)
                    }
                } else {
                    await bot.sendMessage(message.chat.id, "Чтобы бот работал ван нужно подписаться на каналы:")
                }
            } catch (e) {
                console.log(e);
                await bot.sendMessage(message.chat.id, "Что-то пошло не так")
            }
        })

        await bot.onText(regularOptions.help, async message => {
            await help(message)
        })

        await bot.on("message", async message => {
            let notFound = 0

            for (key in regularOptions) {
                notFound += !regularOptions[key].test(message.text) ? 1 : 0
            }

            if (notFound >= Object.keys(regularOptions).length) {
                console.log(message.text);
                await bot.sendMessage(message.chat.id, "Простите, я вас не понимаю.\nВведите /help чтобы узнать, что я умею.", { parse_mode: "HTML" })
            }
        })
    } catch (e) {
        console.log(e);
    }
}

async function greeting(message) {
    await bot.sendMessage(message.chat.id, `Привет, ${message.from.first_name}!`)
    return await bot.sendMessage(message.chat.id, "Введите код фильма/сериала, например \"1\"")
}

async function help(message) {
    return await bot.sendMessage(message.chat.id, "Я умею отправлять названия фильмов/сериалов. Просто введите код фильма/сериала, например \"1\"")
}

async function checkSubscribe(message, loadingMessage) {
    if (true) {
        return true
    }

    return await bot.deleteMessage(message.chat.id, loadingMessage.message_id)
}

function formatResponse(response) {
    return response.data.values.reduce((acc, cur, index) => {
        if (index === 0) {
            return acc
        }

        return { ...acc, [cur[0]]: cur[1] }
    }, {})
}

function trigger() {
    setTimeout(async () => {
        const response = await axios.get("https://vsekinopoisk-trigger.onrender.com/").then(r => r).catch(console.log)
        console.log(response?.status);
        trigger()
    }, delay)
}

start()
trigger()

// EXPRESS

app.get("/", (req, res) => {
    res.end()
})

app.listen(PORT, async () => {
    console.log(console.log(`Server start on port ${PORT}`));

    

})
