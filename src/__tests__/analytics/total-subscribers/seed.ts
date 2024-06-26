import { client } from "@/helpers/dbHelper";

export const seedDB = async () => {
  try {
    // Очищаем все таблицы
    await client.query("TRUNCATE TABLE stat_user RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE TABLE stat_post RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE TABLE stat_reaction RESTART IDENTITY CASCADE");

    // Заполняем таблицы seed данными
    const firstNames = ["John", "Jane", "Alice", "Bob", "Charlie", "David", "Emma", "Olivia", "Ava", "Isabella"];
    const lastNames = [
      "Doe",
      "Smith",
      "Johnson",
      "Brown",
      "Williams",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
    ];
    const usernames = [
      "johndoe",
      "janedoe",
      "alicesmith",
      "bobjohnson",
      "charliebrown",
      "davidwilson",
      "emmajones",
      "oliviawilliams",
      "avagarcia",
      "isabellamiller",
    ];

    const queries = [];
    for (let i = 1; i <= 1000; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const username = `${usernames[i % usernames.length]}${i}`;
      const channelId = 1001 + ((i - 1) % 3); // Распределяем пользователей по 3 каналам
      queries.push(
        `(${i}, ${2000 + i}, ${channelId}, '${firstName}', '${lastName}', '${username}', '2023-01-01', NULL)`
      );
    }

    await client.query(`
      INSERT INTO stat_user (pk, tg_user_id, tg_channel_id, first_name, last_name, username, joined_at, left_at)
      VALUES ${queries.join(", ")};
    `);
  } catch (err) {
    console.error("Error seeding database", err);
  }
};
