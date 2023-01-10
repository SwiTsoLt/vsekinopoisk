const { google } = require('googleapis');
const config = require('config');

const scopes = config.get("scopes")
const spreadsheetId = config.get("spreadsheetId")

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes,
})

async function getClient() {
    const client = await auth.getClient()
    return client
}

async function getSheets() {
    const client = await getClient()
    const sheets = google.sheets({ version: "v4", auth: client })
    return sheets
}

async function getMetaData() {
    const metadata = await (await getSheets()).spreadsheets.get({
        auth,
        spreadsheetId,
    })

    return metadata
}

async function getRows({ range }) {
    const rows = await (await getSheets()).spreadsheets.values.get({
        auth,
        spreadsheetId,
        range
    })

    return rows
}

module.exports = { auth, getClient, getSheets, getMetaData, getRows }