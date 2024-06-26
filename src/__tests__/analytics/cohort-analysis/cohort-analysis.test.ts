import { connectDB, disconnectDB, client, truncate } from "@/helpers/dbHelper";
import { seedCohortAnalysis } from "./seed";
import { expected, expectedJoined } from "./expectedData";

const getCohortAnalysis = async (dateFrom: string, dateTo: string, channelIds: number[]): Promise<any> => {
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
                    "_root.base"."join_date" AS "join_date",
                    "_root.base"."left_date" AS "left_date",
                    "_root.base"."joined_count" AS "joined_count",
                    "_root.base"."left_count" AS "left_count"
                ) AS "_e"
            )
          ) AS "root"
        FROM
          (
            SELECT
              *
            FROM
              "public"."cohort_analysis"(
                ('${dateFrom}') :: date,
                ('${dateTo}') :: date,
                ('{${channelIds.join(",")}}') :: _int8
              ) AS "_cohort_analysis"
            WHERE
              ('true')
          ) AS "_root.base"
      ) AS "_root";
  `;

  const result = await client.query(query);
  return result.rows[0].root;
};

describe("Cohort Analysis", () => {
  beforeAll(async () => {
    await connectDB();
    await truncate();
    await seedCohortAnalysis();
  });

  afterAll(async () => {
    await truncate();
    await disconnectDB();
  });

  it("should return correct cohort analysis data for single tg channel", async () => {
    const response = await getCohortAnalysis("2024-08-01T00:00:00Z", "2024-08-07T00:00:00Z", [1001]);

    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);

    expected[0].forEach((exp, index) => {
      const res = response[index];
      expect(res.join_date).toEqual(exp.join_date);
      expect(res.left_date).toEqual(exp.left_date);
      expect(res.joined_count).toEqual(exp.joined_count);
      expect(res.left_count).toEqual(exp.left_count);
    });
  });

  it("should return correct cohort analysis data for 4 tg channels", async () => {
    const response = await getCohortAnalysis("2024-08-01T00:00:00Z", "2024-08-07T00:00:00Z", [1001, 1002, 1003, 1004]);

    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);

    expectedJoined.forEach((exp, index) => {
      const res = response[index];
      expect(res.join_date).toEqual(exp.join_date);
      expect(res.left_date).toEqual(exp.left_date);
      expect(res.joined_count).toEqual(exp.joined_count);
      expect(res.left_count).toEqual(exp.left_count);
    });
  });
});
