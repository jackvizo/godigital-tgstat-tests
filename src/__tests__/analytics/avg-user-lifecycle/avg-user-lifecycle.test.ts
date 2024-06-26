import { connectDB, client, disconnectDB } from "@/helpers/dbHelper";
import { expectedAvgLifecycleDays, seedDB } from "./seed";

export const getAvgUserLifecycle = async (channelIds: number[]): Promise<number> => {
  const channelIdsString = channelIds.join(",");

  const result = await client.query(`
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
              "public"."get_avg_user_lifecycle"(('{${channelIdsString}}') :: _int8) AS "_get_avg_user_lifecycle"
            WHERE
              ('true')
          ) AS "_root.base"
      ) AS "_root"
  `);

  return result.rows[0].root[0].avg_lifecycle_days;
};

beforeAll(async () => {
  await connectDB();
  await seedDB();
});

afterAll(async () => {
  await disconnectDB();
});

test("should return correct average user lifecycle for given channels", async () => {
  const avgLifecycleDays = await getAvgUserLifecycle([1001, 1002, 1003]);
  console.log(`Expected Average User Lifecycle: ${expectedAvgLifecycleDays}`);
  console.log(`Actual Average User Lifecycle: ${avgLifecycleDays}`);
  expect(avgLifecycleDays).toBeCloseTo(expectedAvgLifecycleDays, 1); // Проверка на точное значение среднего цикла жизни пользователей с точностью до 1 знака после запятой
});
