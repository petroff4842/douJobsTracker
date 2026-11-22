import { XMLParser } from "fast-xml-parser";
import "dotenv/config";
import { vacancyExists, saveVacancy } from "./database.js";
import cron from "node-cron";

const RSS_URL = "https://jobs.dou.ua/vacancies/feeds/?category=Front%20End";
const KEYWORDS = [
    "pixi",
    "pixijs",
    "javascript",
    "typescript",
    "game developer",
    "slot",
    "html5",
    "webgl"
];

let isRunning = false;

async function main(): Promise<void> {
    if (isRunning) {
        return;
    }
    isRunning = true;
    try {
        const response = await fetch(RSS_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }
        const xml = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(xml);

        const vacancies = result.rss.channel.item;

        for (const vacancy of vacancies) {
            // const isRelevant = KEYWORDS.some(keyword =>
            //     vacancy.title.toLowerCase().includes(keyword.toLowerCase())
            // );
            const isRelevant = true;
            if (isRelevant) {
                const publishedAt = vacancy.pubDate;
                const exists = vacancyExists(vacancy.link, publishedAt);
                if (!exists) {
                    const message = `${vacancy.title}\n${vacancy.link}`;
                    await sendMessage(message);
                    saveVacancy(vacancy.title, vacancy.link, publishedAt);
                }
            }
        }
    } finally {
        isRunning = false;
    }
}

cron.schedule("*/15 * * * *", () => {
    main();
});

main();

async function sendMessage(text: string): Promise<void> {
    const token = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });

    const result = await response.json();
    console.log(result);
}