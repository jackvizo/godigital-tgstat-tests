import { connectDB, disconnectDB, truncate } from "@/helpers/dbHelper";
import { seedDB } from "./seed";
import { client } from "@/helpers/dbHelper";

/**
 * Получает средний цикл жизни пользователя в днях для заданных каналов.
 * @param tgChannelIds Массив ID каналов.
 * @returns Средний цикл жизни пользователя в днях.
 */
async function getAvgUserLifecycle(tgChannelIds: number[]): Promise<number> {
  const query = `
  SELECT
    coalesce(json_agg("root"), '[]') AS "root"
  FROM
    (
      SELECT
        row_to_json(
          (
            SELECT
              "_e"
            FROM
              (
                SELECT
                  "_root.base"."avg_lifecycle_days" AS "avg_lifecycle_days"
              ) AS "_e"
          )
        ) AS "root"
      FROM
        (
          SELECT
            *
          FROM
            "public"."get_avg_user_lifecycle"(('{${tgChannelIds.join(",")}}') :: _int8) AS "_get_avg_user_lifecycle"
          WHERE
            ('true')
        ) AS "_root.base"
    ) AS "_root"
  `;
  const result = await client.query(query);

  return parseFloat(result.rows[0].root[0].avg_lifecycle_days);
}

beforeAll(async () => {
  await connectDB();
  await truncate();
});

afterAll(async () => {
  await truncate();
  await disconnectDB();
});

const testCases = [
  { expectedAvgLifecycleDays: 5.555, description: "average lifecycle of 5.555 days" },
  { expectedAvgLifecycleDays: 3.333, description: "average lifecycle of 3.333 days" },
  { expectedAvgLifecycleDays: 7.777, description: "average lifecycle of 7.777 days" },
  { expectedAvgLifecycleDays: 0.123, description: "average lifecycle of 0.123 days" },
  { expectedAvgLifecycleDays: 30.456, description: "average lifecycle of 30.456 days" },
  { expectedAvgLifecycleDays: 0, description: "average lifecycle of 0 days" },
  { expectedAvgLifecycleDays: 365.25, description: "average lifecycle of 365.25 days" },
  { expectedAvgLifecycleDays: 10.1, description: "average lifecycle of 10.1 days" },
  { expectedAvgLifecycleDays: 15.75, description: "average lifecycle of 15.75 days" },
  { expectedAvgLifecycleDays: 50.99, description: "average lifecycle of 50.99 days" },
];

describe("Average User Lifecycle Tests", () => {
  testCases.forEach(({ expectedAvgLifecycleDays, description }) => {
    describe(`when expected average lifecycle is ${description}`, () => {
      beforeAll(async () => {
        await truncate();
        await seedDB(expectedAvgLifecycleDays);
      });

      afterAll(async () => {
        await truncate();
      });

      test(`should return correct average user lifecycle for ${description}`, async () => {
        const avgLifecycleDays = await getAvgUserLifecycle([1001, 1002, 1003]);
        expect(avgLifecycleDays).toBeCloseTo(expectedAvgLifecycleDays, 2); // Проверка на точное значение среднего цикла жизни пользователей с точностью до 2 знаков после запятой
      });
    });
  });
});
