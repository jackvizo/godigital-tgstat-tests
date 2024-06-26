import { connectDB, disconnectDB, client } from "@/helpers/dbHelper";
import { seedDB } from "./seed";

const getActiveSubscribersCount = async (channelIds: number[]): Promise<number> => {
  const channelIdsString = channelIds.join(",");

  const result = await client.query(`
  SELECT
    json_build_object(
      'aggregate',
      json_build_object('count', COUNT(("_root"."root.pg.pk")))
    ) AS "root"
  FROM
    (
      SELECT
        "_root.base"."pk" AS "root.pg.pk"
      FROM
        (
          SELECT
            *
          FROM
            "public"."stat_user"
          WHERE
            (
              (
                ("public"."stat_user"."tg_channel_id") = ANY('{${channelIdsString}}'::bigint[])
              )
              AND (("public"."stat_user"."left_at") IS NULL)
            )
        ) AS "_root.base"
    ) AS "_root"
  `);

  return result.rows[0].root.aggregate.count;
};

beforeAll(async () => {
  await connectDB();
  await seedDB();
});

afterAll(async () => {
  await disconnectDB();
});

test("should return correct count of active subscribers for given channel 1001", async () => {
  const count = await getActiveSubscribersCount([1001]);
  expect(count).toBe(334); // Ожидаемое количество активных подписчиков в канале 1001
});

test("should return correct count of active subscribers for given channel 1002", async () => {
  const count = await getActiveSubscribersCount([1002]);
  expect(count).toBe(333); // Ожидаемое количество активных подписчиков в канале 1002
});

test("should return correct count of active subscribers for channels 1001 and 1002", async () => {
  const count = await getActiveSubscribersCount([1001, 1002]);
  expect(count).toBe(667); // Ожидаемое количество активных подписчиков в каналах 1001 и 1002
});
