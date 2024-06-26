import { client } from "@/helpers/dbHelper";
import { generateTimeIntervals } from "./seed-intervals";

export const expectedAvgLifecycleDays = 5.5;

/**
 * Формирует строки INSERT для пользователей
 * @param intervals Массив пользователей
 * @param totalUsers Общее количество пользователей
 * @param channelIdStart Начальный ID канала
 * @returns Строка с запросом INSERT
 */
function generateInsertStrings(
  intervals: { start: Date; end: Date | null }[],
  totalUsers: number,
  channelIdStart: number
): string {
  return intervals
    .map((interval, index) => {
      const channelId = channelIdStart + (index % 3);
      const firstName = `User${index + 1}`;
      const lastName = `Last${index + 1}`;
      const username = `user${index + 1}`;
      const joinedAt = interval.start.toISOString();
      const leftAt = interval.end ? `'${interval.end.toISOString()}'` : "NULL";
      return `(${
        2000 + index + 1
      }, ${channelId}, '${firstName}', '${lastName}', '${username}', '${joinedAt}', ${leftAt})`;
    })
    .join(", ");
}

export const seedDB = async (expectedAvgLifecycleDays: number): Promise<void> => {
  try {
    // Очищаем таблицы перед заполнением
    await client.query("TRUNCATE TABLE stat_user RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE TABLE stat_post RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE TABLE stat_reaction RESTART IDENTITY CASCADE");

    // Генерация временных промежутков для пользователей, которые покинули систему
    const leftUsers1 = generateTimeIntervals(expectedAvgLifecycleDays, 200);
    const leftUsers2 = generateTimeIntervals(expectedAvgLifecycleDays, 500);
    const leftUsers3 = generateTimeIntervals(expectedAvgLifecycleDays, 100);

    // Генерация начальных дат для пользователей, которые остались в системе
    const notLeftUsers1 = Array(100)
      .fill(0)
      .map((_, i) => ({ start: new Date(`2023-01-${(i % 28) + 1}`), end: null }));
    const notLeftUsers2 = Array(300)
      .fill(0)
      .map((_, i) => ({ start: new Date(`2023-01-${(i % 28) + 1}`), end: null }));
    const notLeftUsers3 = Array(200)
      .fill(0)
      .map((_, i) => ({ start: new Date(`2023-01-${(i % 28) + 1}`), end: null }));

    // Преобразование интервалов в формат дат
    const startDate = new Date("2023-01-01");
    const convertIntervals = (intervals: Array<[number, number]>) =>
      intervals.map(([start, end]) => {
        const startInterval = new Date(startDate);
        const endInterval = new Date(startDate);
        startInterval.setDate(startInterval.getDate() + Math.floor(start));
        endInterval.setDate(endInterval.getDate() + Math.floor(end));
        return { start: startInterval, end: endInterval };
      });

    const dateLeftUsers1 = convertIntervals(leftUsers1);
    const dateLeftUsers2 = convertIntervals(leftUsers2);
    const dateLeftUsers3 = convertIntervals(leftUsers3);

    // Объединение массивов пользователей, перемешивая их
    const mixedUsers = [
      ...notLeftUsers1,
      ...dateLeftUsers1,
      ...notLeftUsers2,
      ...dateLeftUsers2,
      ...notLeftUsers3,
      ...dateLeftUsers3,
    ];

    // Заполняем таблицы seed данными на чистом SQL
    const seedQuery = `
      INSERT INTO stat_user (tg_user_id, tg_channel_id, first_name, last_name, username, joined_at, left_at)
      VALUES ${generateInsertStrings(mixedUsers, 1400, 1001)};
    `;

    await client.query(seedQuery);
  } catch (err) {
    console.error("Error seeding database", err);
    throw err;
  }
};

/*
Сводка данных:
- Всего пользователей: 1400
- Пользователи, которые покинули систему: 800
- Пользователи, которые остались в системе: 600
- Распределение по каналам:
  - Канал 1001: треть пользователей
  - Канал 1002: треть пользователей
  - Канал 1003: треть пользователей
- Средний цикл жизни пользователя рассчитывается для пользователей, имеющих непустое значение left_at
*/
