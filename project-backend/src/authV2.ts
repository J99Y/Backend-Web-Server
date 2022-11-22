import { getData, setData } from './dataStore';
import { checkToken } from './authV3';
import { STATUS, INVALID } from './magic_nums';

import { errorString } from './errors';
import createHttpError from 'http-errors';

// -------------------------------- //
// ---------Auth Functions--------- //

interface AuthLogoutV2Return {
  error?: string
}

/**
 * This function logs a user out by invalidating their token
 *
 * @param {string} token - token of user logging out
 * @returns {{}} - if logout successful
 * @returns {{ error: string }} - when token is invalid
 */
export function authLogoutV2(token: string): AuthLogoutV2Return {
  const dataStore = getData();

  if (checkToken(token) === INVALID) { throw createHttpError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const uId = checkToken(token);
  const userIndex = dataStore.users.findIndex(user => user.uId === uId);
  if (dataStore.users[userIndex].activeTokens.length === 1) {
    dataStore.users[userIndex].activeTokens = [];
  } else {
    // const tokenIndex = dataStore.users[userIndex].activeTokens.findIndex(item => item === token);
    dataStore.users[userIndex].activeTokens = dataStore.users[userIndex].activeTokens.filter(item => item !== token);
  }

  setData(dataStore);

  return {};
}
