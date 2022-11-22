import validator from 'validator';
import { getData, setData, UserObject } from './dataStore';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import HTTPError from 'http-errors';
import { errorString, ReturnError } from './errors';
import { STATUS, INVALID, LENGTH } from './magic_nums';
// -------------------------------- //
// ---------Auth Functions--------- //

interface AuthRegisterV1Return {
    authUserId?: number,
    error?: string,
    token?: string
}

/**
 * <This function registers a new account, taking in the user's email, password, first and last names>
 *
 * @param {string} email - new users email
 * @param {string} password - new users password
 * @param {string} nameFirst - new users first name
 * @param {string} nameLast - new users last name
 * @returns {{ authUserId : number, token : string }} - object containing new user's authUserId and their session token
 * @returns {{ error: string }} - when email is invalid
 *                              - when email is in use
 *                              - when password not between 6-200 characters
 *                              - when nameFirst not between 1-50 characters
 *                              - when nameLast not between 1-50 characters
 */
export function authRegisterV3(email?: string, password?: string, nameFirst?: string, nameLast?: string): AuthRegisterV1Return {
  const dataStore = getData();

  if (!(dataStore.emails.indexOf(email) === -1)) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.emailAlreadyUsed);
  }

  if (password.length < LENGTH.MIN_PASSWORD || password.length > LENGTH.MAX_PASSWORD) { throw HTTPError(STATUS.BAD_REQUEST, errorString.passwordLength); }
  if (nameFirst.length < LENGTH.MIN_NAMELENGTH || nameFirst.length > LENGTH.MAX_NAMELENGTH) { throw HTTPError(STATUS.BAD_REQUEST, errorString.firstNameLength); }
  if (nameLast.length < LENGTH.MIN_NAMELENGTH || nameLast.length > LENGTH.MAX_NAMELENGTH) { throw HTTPError(STATUS.BAD_REQUEST, errorString.lastNameLength); }
  if (!(validator.isEmail(email))) { throw HTTPError(STATUS.BAD_REQUEST, errorString.emailNotValid); }

  const permissionId = (dataStore.users.length === 0) ? 1 : 2;

  let handle = getUserHandle(nameFirst, nameLast);

  const numArr = handle.match(/[0-9]+$/);
  let highestHandleInt = -1;
  let uniqueHandle = null;

  if (numArr === null) {
    for (let i = 0; i < dataStore.users.length; i++) {
      const user = dataStore.users[i];
      if (user.handleStr === handle) {
        if (user.handleInt === -1) {
          highestHandleInt = 0;
        } else {
          if (user.handleInt === highestHandleInt) { highestHandleInt = user.handleInt + 1; }
        }
      }
    }
    if (highestHandleInt === -1) { uniqueHandle = handle; } else { uniqueHandle = handle + String(highestHandleInt); }
  } else {
    highestHandleInt = parseInt(numArr[0]);
    uniqueHandle = handle;
    handle = handle.substring(0, numArr.index);
  }

  const uId = dataStore.users.length === 0 ? 1 : dataStore.users[dataStore.users.length - 1].uId + 1;

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sessionUserId: email, uId: uId, time: Date.now() }, 'secret');

  const hashPassword = Base64.stringify(sha256(password));

  // timeStamp for user creation
  const accountCreated = Math.floor((new Date()).getTime() / 1000);
  const userObject: UserObject = {
    uId: uId,
    email: email,
    permissionId: permissionId,
    nameFirst: nameFirst,
    nameLast: nameLast,
    handleStr: handle,
    handleStrDisplay: uniqueHandle,
    handleInt: highestHandleInt,
    password: hashPassword,
    channelIds: [],
    activeTokens: [],
    ownedChannelIds: [],
    dmIds: [],
    ownedDmIds: [],
    globalOwner: (uId === 1),
    userStats: {
      channelsJoined: [{ numChannelsJoined: 0, timeStamp: accountCreated }],
      dmsJoined: [{ numDmsJoined: 0, timeStamp: accountCreated }],
      messagesSent: [{ numMessagesSent: 0, timeStamp: accountCreated }],
    },
    resetToken: '',
    resetCounter: 0,
    notifications: [],
    isActive: true,
    profilePhoto: 'http://localhost:8082/profilePhotos/default.jpg'
  };

  userObject.activeTokens.push(token);

  dataStore.emails.push(email);
  dataStore.users.push(userObject);
  setData(dataStore);

  return { authUserId: uId, token: token };
}

/**
 * <This function takes a users first and last names and returns the user handle ignoring the number iterator on the end>
 *
 * @param {string} firstName - the users first name
 * @param {string} lastName - the users last name
 * @returns {string} uniqueHandle - the user handle
 */
function getUserHandle(firstName: string, lastName: string): string {
  let uniqueHandle = firstName + lastName;
  uniqueHandle = uniqueHandle.toLowerCase();

  uniqueHandle = uniqueHandle.replace(/[^0-9a-z]/gi, '');

  if (uniqueHandle.length > LENGTH.HANDLE) {
    uniqueHandle = uniqueHandle.slice(0, 20);
  }

  return uniqueHandle;
}

interface AuthLoginV3Return {
  authUserId: number
  token: string
}

/**
 * This function takes a users email and password and creates a valid session token for login
 *
 * @param {string} email - existing users email
 * @param {string} password - existing users password
 * @returns {{ authUserId : number, token : string }} - object containing existing user's authUserId and their session token
 * @returns {{ error: string }} - when email does not belong to any user
 *                              - when password is incorrect
 *                              - if the user is inactive
 */
export function authLoginV3(email: string, password: string): AuthLoginV3Return | ReturnError {
  const dataStore = getData();
  const userObject = dataStore.users.find(user => user.email === email);

  const hashPassword = Base64.stringify(sha256(password));

  if (userObject === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.emailNotFound); }
  if (userObject.password !== hashPassword) { throw HTTPError(STATUS.BAD_REQUEST, errorString.passwordIncorrect); }

  const uId = userObject.uId;
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sessionUserId: email, uId: userObject.uId, time: Date.now() }, 'secret');

  dataStore.users[dataStore.users.findIndex(user => user.email === email)].activeTokens.push(token);
  setData(dataStore);

  return { authUserId: uId, token: token };
}

/**
 * This function checks if a token is valid
 *
 * @param {string} token - token to be checked
 * @returns {number} uId - if token is valid, uId of the token is returned, else -1 is returned
 */
export function checkToken(token: string): number {
  const dataStore = getData();
  const jwt = require('jsonwebtoken');
  const decodedToken = jwt.decode(token);
  if (decodedToken === null) { return INVALID; }
  const uid = decodedToken.uId;
  const userObject = dataStore.users.find(user => user.uId === uid);
  if (userObject === undefined) { return INVALID; }
  if (userObject.activeTokens.findIndex(curToken => curToken === token) === -1) { return INVALID; }

  return (jwt.decode(token).uId);
}
