import db from '../dbConnection.js';
import * as dbModel from '../dbAccessLayer.js';

export async function checkWordInDict(word) {
  let status;
  try {
    const dbConnection = await db.getConnection();
    const [result] = await dbModel.getWord(word);
    if (result[0]) {
      status = true;
    } else {
      status = false;
    }
    dbConnection.release();
    return status;
  } catch (error) {
    console.log(error);
  }
}
