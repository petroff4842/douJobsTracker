import Database from "better-sqlite3";

const db = new Database("jobs.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS vacancies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        published_at TEXT NOT NULL,
        UNIQUE(link, published_at)
    )
`);

const insertVacancy = db.prepare(`
    INSERT INTO vacancies (title, link, published_at)
    VALUES (?, ?, ?)
`);

// insertVacancy.run(
//     "Frontend Developer",
//     "https://jobs.dou.ua/vacancies/123/",
//     "2026-11-22"
// );

export function vacancyExists(link: string, publishedAt: string): boolean {
    const vacancy = db.prepare(`
        SELECT id FROM vacancies
        WHERE link = ? AND published_at = ?
    `).get(link, publishedAt);

    return vacancy !== undefined;
}

export function saveVacancy(title: string, link: string, publishedAt: string): void {
    insertVacancy.run(title, link, publishedAt);
}