import { client } from "@/helpers/dbHelper";
import { expected } from "./expectedData";

type ExpectedDataType = (typeof expected)[number];

type MatrixEntryType = {
  join_date: string;
  left_date: string;
  joined_count: number;
  left_count: number;
};

type User = {
  tg_user_id: string;
  tg_channel_id: number | null;
  joined_at: string | null;
  left_at: string | null;
};

function transformExpectedData(expectedData: ExpectedDataType): MatrixEntryType[][] {
  const matrix: MatrixEntryType[][] = [];

  expectedData.forEach((entry) => {
    const { join_date, left_date, joined_count, left_count } = entry;
    const rowIndex = matrix.findIndex((row) => row[0]?.join_date === join_date);

    if (rowIndex === -1) {
      matrix.push([{ join_date, left_date, joined_count, left_count }]);
    } else {
      matrix[rowIndex].push({ join_date, left_date, joined_count, left_count });
    }
  });

  return matrix;
}

function getFirstColumn(matrix: MatrixEntryType[][]): MatrixEntryType[] {
  return matrix.map((row) => row[0]);
}

export function updateUsersWithLeftDate(users: User[], row: MatrixEntryType[], flag: boolean): User[] {
  const updatedUsers = [...users];
  let k = 0;
  row.forEach((entry) => {
    const { left_date, left_count } = entry;

    if (entry.left_count > entry.joined_count) {
      throw new Error("entry.left_count > entry.joined_count");
    }

    for (let i = 0; i < left_count; i++) {
      updatedUsers[k].left_at = `${left_date} 00:00:00`;
      k++;
    }
  });

  return updatedUsers;
}

const countUsersInColumn = (col: MatrixEntryType[]): number => {
  return col.reduce((acc, item) => acc + item.joined_count, 0);
};

function cohortArrayToUsers(cohorts: ExpectedDataType[]): User[] {
  let totalUsersCount = 0;

  const usersPerChannelShareRate = 0.15;

  for (const cohort of cohorts) {
    const m = transformExpectedData(cohort);
    const firstColumn = getFirstColumn(m);
    const usersCountInChannel = countUsersInColumn(firstColumn);
    totalUsersCount += usersCountInChannel;
  }
  totalUsersCount = Math.floor(totalUsersCount - totalUsersCount * usersPerChannelShareRate);

  const totalUsers: User[] = Array(totalUsersCount)
    .fill(0)
    .map((_, index) => ({ joined_at: null, left_at: null, tg_channel_id: null, tg_user_id: `${index + 1}` }));
  let usersDeck = [...totalUsers];
  const itemsToInsert: User[] = [];

  let tgChannelId = 1001;
  for (const cohort of cohorts) {
    const m = transformExpectedData(cohort);
    const firstColumn = getFirstColumn(m);
    let i = 0;
    for (const cell of firstColumn) {
      let joinedUsers: User[] = [];

      if (usersDeck.length < cell.joined_count) {
        const usersDeckLength = usersDeck.length;
        joinedUsers = usersDeck.splice(0, usersDeckLength);
        usersDeck = [...totalUsers];
        joinedUsers.push(...usersDeck.splice(0, cell.joined_count - usersDeckLength));
      } else {
        joinedUsers = usersDeck.splice(0, cell.joined_count);
      }

      joinedUsers = joinedUsers.map((item) => ({
        ...item,
        tg_channel_id: tgChannelId,
        joined_at: `${cell.join_date} 00:00:00`,
      }));

      const updatedUsers = updateUsersWithLeftDate(joinedUsers, m[i], i === 1);
      itemsToInsert.push(...updatedUsers);
      i++;
    }
    tgChannelId++;
  }

  return itemsToInsert;
}

export async function seedCohortAnalysis() {
  const usersToInrsert = cohortArrayToUsers(expected);
  const insertQuery = `
    INSERT INTO stat_user (tg_user_id, tg_channel_id, joined_at, left_at)
    VALUES ${usersToInrsert
      .map(
        (item) =>
          `(${item.tg_user_id},${item.tg_channel_id},'${item.joined_at}',${
            item.left_at ? `'${item.left_at}'` : "NULL"
          })`
      )
      .join(", ")};
  `;

  await client.query(insertQuery);
}
