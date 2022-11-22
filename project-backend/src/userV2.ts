import validator from 'validator';

import { getData, setData } from './dataStore';
import { checkToken } from './authV3';

import HTTPError from 'http-errors';
import { errorString } from './errors';
import { isActiveUserUid } from './adminV1';
import { INVALID, LENGTH, STATUS } from './magic_nums';

// -------------------------------- //
// ---------User Functions--------- //

interface SetNameV2Return {
  error?: string
}

/**
 * <Function to change users name>
 *
 * @param {string} token - user token
 * @param {string} nameFirst - new first name
 * @param {string} nameLast - new last name
 * @returns {{ error: string }} - when length of nameFirst not between 1-50 characters
 *                              - when length of nameLast not between 1-50 characters
 *                              - when token is invalid
 */
export function setNameV2(token: string, nameFirst: string, nameLast: string): SetNameV2Return {
  if (nameFirst.length < LENGTH.MIN_NAMELENGTH || nameFirst.length > LENGTH.MAX_NAMELENGTH) { throw HTTPError(STATUS.BAD_REQUEST, errorString.firstNameLength); }
  if (nameLast.length < LENGTH.MIN_NAMELENGTH || nameLast.length > LENGTH.MAX_NAMELENGTH) { throw HTTPError(STATUS.BAD_REQUEST, errorString.lastNameLength); }
  const uId = checkToken(token);
  if (uId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const data = getData();
  const userIndex = data.users.findIndex(user => user.uId === uId);

  data.users[userIndex].nameFirst = nameFirst;
  data.users[userIndex].nameLast = nameLast;

  setData(data);

  return {};
}

interface SetEmailV2Return {
  error?: string
}

/**
 * <Function to change users email>
 *
 * @param {string} token - user token
 * @param {string} email - new email
 * @returns {{ error: string }} - when email is invalid
 *                              - when email is being used already
 *                              - when token is invalid
 */
export function setEmailV2(token: string, email: string): SetEmailV2Return {
  const dataStore = getData();

  if (!(validator.isEmail(email))) { throw HTTPError(STATUS.BAD_REQUEST, errorString.emailNotValid); }
  const uId = checkToken(token);
  if (uId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  const users = dataStore.users;
  if (!(users.find(user => user.email === email) === undefined)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.emailAlreadyUsed); }

  const userIndex = dataStore.users.findIndex(user => user.uId === uId);

  dataStore.users[userIndex].email = email;

  const emailIndex = dataStore.emails.indexOf(email);
  dataStore.emails[emailIndex] = email;

  setData(dataStore);

  return {};
}

interface SetHandleV2Return {
  error?: string
}

/**
 * <Function to change users handle>
 *
 * @param {string} token - user token
 * @param {string} handleStr - new handle
 * @returns {{ error: string }} - when handle is not between 3-20 characters
 *                              - when handle is not alphanumeric
 *                              - when handle is already taken
 *                              - when token is invalid
 */
export function setHandleStrV2(token: string, handleStr: string): SetHandleV2Return {
  const dataStore = getData();
  const uId = checkToken(token);

  if (uId === -1) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  if (handleStr.length < 3 || handleStr.length > 20) { throw HTTPError(STATUS.BAD_REQUEST, errorString.handleStringLength); }

  const isAlphaNumeric = (str: string) => /^[a-z0-9]+$/gi.test(str);
  if (!isAlphaNumeric(handleStr)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.handleStringNotAlpha); }
  const users = dataStore.users;
  if (!(users.find(user => user.handleStrDisplay === handleStr) === undefined)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.handleAlreadyTaken); }

  const userIndex = dataStore.users.findIndex(user => user.uId === uId);
  dataStore.users[userIndex].handleStrDisplay = handleStr;

  setData(dataStore);

  return {};
}

interface GetAllUsersV1Return {
  users?: Array<any>
  error?: string
}

/**
 * <Function to list all users>
 *
 * @param {string} token - user token
 * @returns {{ users: [] }} - list of all user's userObject
 * @returns {{ error: string }} - when token is invalid
 */
export function getAllUsersV2(token: string): GetAllUsersV1Return {
  const uId = checkToken(token);

  if (uId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  const outArray = [];

  const dataStore = getData();
  for (const user of dataStore.users) {
    // 1.1 check if the uId refer to an active user && token is a active user
    if (isActiveUserUid(user.uId) === true) {
      outArray.push({
        uId: user.uId,
        email: user.email,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        handleStr: user.handleStrDisplay,
        profileImgUrl: user.profilePhoto
      });
    }
  }

  return { users: outArray };
}
