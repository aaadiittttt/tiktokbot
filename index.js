const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
const moment = require("moment");
const fs = require("fs-extra");
const config = require("./config.json");

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionFile);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || !m.key.remoteJid) return;

        const from = m.key.remoteJid;
        const msgText = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const command = msgText.toLowerCase().split(" ")[0];

        // Command !menu
        if (command === "!menu") {
            const buttons = [
                { buttonId: "runtime", buttonText: { displayText: "⏳ Runtime" }, type: 1 },
                { buttonId: "datetime", buttonText: { displayText: "📆 Date & Time" }, type: 1 },
                { buttonId: "author", buttonText: { displayText: "👤 Author" }, type: 1 }
            ];

            const buttonMessage = {
                image: { url: config.imageBanner },
                caption: `📌 *Bot Menu*\n⏳ *Uptime:* ${process.uptime()}s\n📆 *Date:* ${moment().format("YYYY-MM-DD HH:mm:ss")}\n🔗 *GitHub:* ${config.github}`,
                footer: "WhatsApp Bot",
                buttons: buttons,
                headerType: 4
            };

            await sock.sendMessage(from, buttonMessage);
        }

        // Command Download TikTok No Watermark
        if (command.startsWith("!tiktok")) {
            const url = msgText.split(" ")[1];
            if (!url) return sock.sendMessage(from, { text: "❌ Masukkan link TikTok!" });

            try {
                const { data } = await axios.get(`https://api.ssstik.io/tik-tok/tikmp3?url=${url}`);
                await sock.sendMessage(from, { video: { url: data.videoUrl }, caption: "🎥 *TikTok Video*" });
            } catch (err) {
                sock.sendMessage(from, { text: "❌ Gagal download video!" });
            }
        }

        // Command Download Instagram No Watermark
        if (command.startsWith("!instagram")) {
            const url = msgText.split(" ")[1];
            if (!url) return sock.sendMessage(from, { text: "❌ Masukkan link Instagram!" });

            try {
                const { data } = await axios.get(`https://saveig.app/api?url=${url}`);
                await sock.sendMessage(from, { video: { url: data.videoUrl }, caption: "🎥 *Instagram Video*" });
            } catch (err) {
                sock.sendMessage(from, { text: "❌ Gagal download video!" });
            }
        }

        // Command Download YouTube Video
        if (command.startsWith("!youtube")) {
            const url = msgText.split(" ")[1];
            if (!url) return sock.sendMessage(from, { text: "❌ Masukkan link YouTube!" });

            try {
                const { data } = await axios.get(`https://api.y2mate.com/api/v1/download?url=${url}`);
                await sock.sendMessage(from, { video: { url: data.videoUrl }, caption: "🎥 *YouTube Video*" });
            } catch (err) {
                sock.sendMessage(from, { text: "❌ Gagal download video!" });
            }
        }

        // Handle Button Clicks
        sock.ev.on("messages.upsert", async ({ messages }) => {
            const btn = messages[0].message?.buttonsResponseMessage?.selectedButtonId;
            if (!btn) return;

            if (btn === "runtime") {
                sock.sendMessage(from, { text: `⏳ *Bot Uptime:* ${process.uptime()}s` });
            } else if (btn === "datetime") {
                sock.sendMessage(from, { text: `📆 *Date & Time:* ${moment().format("YYYY-MM-DD HH:mm:ss")}` });
            } else if (btn === "author") {
                sock.sendMessage(from, { text: `👤 *Bot Author:* ${config.owner}` });
            }
        });
    });
};

startBot();