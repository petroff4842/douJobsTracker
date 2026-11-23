import { XMLParser } from "fast-xml-parser";
import "dotenv/config";
import { vacancyExists, saveVacancy } from "./database.js";

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

async function main(): Promise<void> {
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
                try {
                    const message = `${vacancy.title}\n${vacancy.link}`;
                    await sendMessage(message);
                } catch (error) {
                    // Не сохраняем в базу: вакансия будет отправлена при следующем запуске
                    console.error(`Failed to send vacancy ${vacancy.link}:`, error);
                    await sleep(1000);
                    continue;
                }

                try {
                    saveVacancy(vacancy.title, vacancy.link, publishedAt);
                } catch (error) {
                    // Сообщение уже ушло, поэтому при следующем запуске возможен дубль
                    console.error(`Sent but failed to save ${vacancy.link}:`, error);
                }

                // Пауза между сообщениями, чтобы не упереться в лимиты Telegram
                await sleep(1000);
            }
        }
    }
}

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
    if (!result.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }
    console.log(result);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}