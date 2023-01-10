const { auth, getSheets } = require('./googleAuth');
const { google } = require('googleapis');
const config = require('config');

const spreadsheetId = config.get("spreadsheetId")

async function getAnalytics() {
    try {
        const result = await (await getSheets()).spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "analytics"
        })

        return result
    } catch (e) {
        console.log(e);
    }
}

async function sendUserAnalytic(message) {
    try {
        const response = await getAnalytics()
        const data = formatAnalyticsReponse(response)
        await (await getSheets()).spreadsheets.values.update

            (await getSheets()).spreadsheets.values.appen({
                auth,
                spreadsheetId,
                range: "analytics!A:G",
                resource: {
                    values: [
                        [
                            message.from.id,
                            message.from.username,
                            message.from.first_name,
                            message.from.last_name,
                            Number(data[message.from.id]["search_count"]) + 1,
                            `${data[message.from.id]["search_data"], message.text}`,
                            0
                        ]
                    ]
                }
            })
    } catch (e) {
        console.log(e);
    }
}

function formatAnalyticsReponse(response) {
    const data = response.data.values

    function createUser(arr, index) {
        const arrKeys = arr[0]

        return arrKeys.reduce((acc, cur, i) => {
            if (i === 0) {
                return acc
            }

            return {
                [arr[index][0]]: {
                    ...acc[arr[index][0]],
                    [cur]: arr[index][i]
                }
            }
        }, {})
    }

    return data.reduce((acc, cur, index) => {
        if (index === 0) {
            return acc
        }
        return { ...acc, ...createUser(data, index) }
    }, {})
}

module.exports = { getAnalytics, sendUserAnalytic }