const { 
    makeWASocket, 
    useMultiFileAuthState, 
    jidDecode, 
    makeInMemoryStore, 
    DisconnectReason,
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const readline = require('readline');
const spinnies = new (require('spinnies'))();
const qrcode = require('qrcode-terminal');
const autoViewStatus = require('./lib/autoview');
const displayBanner = require('./lib/banner');

const usePairingCode = true;

async function question(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

const main = async () => {
    const ridwanz = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    });

    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    displayBanner();

    const ridwanzSocket = makeWASocket({
        logger: pino({
            level: 'silent'
        }),
        printQRInTerminal: !usePairingCode,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.04.6"],
        auth: state
    });

    if (usePairingCode && !state.creds.registered) {
        const phoneNumber = await question(chalk.blue('Masukan Nomor Anda: '));
        const code = await ridwanzSocket.requestPairingCode(phoneNumber.trim());
        console.log(chalk.green(`Pairing Kode Anda: ${code}`));
    }

    ridwanzSocket.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        await autoViewStatus(m, ridwanzSocket);
    });

    ridwanzSocket.decodeJid = (jid) => {
        if (!jid) return jid;
        return /:\d+@/gi.test(jid) ? (jidDecode(jid) || {}).user + '@' + (jidDecode(jid) || {}).server : jid;
    };

    ridwanzSocket.ev.on('connection.update', (update) => handleConnectionUpdate(update, ridwanzSocket, saveCreds));
    ridwanzSocket.ev.on('creds.update', saveCreds);
};

const handleConnectionUpdate = (update, ridwanzSocket, saveCreds) => {
    const { connection, lastDisconnect, qr } = update;
    if (typeof lastDisconnect !== 'undefined' && typeof qr !== 'undefined') {
        qrcode.generate(qr, {
            small: true
        });
    }
    if (connection === 'connecting') {
        spinnies.add('start', {
            text: 'Sedang Menghubungkan...'
        });
    } else if (connection === 'open') {
        spinnies.succeed('start', {
            text: `Berhasil Terhubung!`
        });
    } else if (connection === 'close') {
        if (lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut) {
            console.log(chalk.red('Perangkat Telah Keluar, Silakan Hapus Folder session Dan Hubungkan Kembali.'));
            process.exit(0);
        } else {
            main().catch(() => main());
        }
    }
};

const start = () => {
    main().catch(err => {
        console.error("Error Starting Bot:", err);
        process.exit(1);
    });
};

start();