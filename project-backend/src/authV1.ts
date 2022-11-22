import { getData, setData } from './dataStore';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import HTTPError from 'http-errors';
import { STATUS, INVALID } from './magic_nums';
import { errorString } from './errors';

// -------------------------------- //
// ---------Auth Functions--------- //

/**
 * This function generates a reset and sends a user the reset token over email
 *
 * @param {string} email - the users email
 * @returns {{token}} - returns the valid token
 * @returns {{}} - if email does not exist
 */
export function authRequestResetToken(email: string) {
  const dataStore = getData();
  const userIndex = dataStore.users.findIndex(user => user.email === email);
  if (userIndex === INVALID) { return {}; }
  const resetToken = Base64.stringify(sha256(email + dataStore.users[userIndex].resetCounter));
  dataStore.users[userIndex].resetToken = resetToken;

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com.au',
    port: 465,
    secure: true,
    auth: {
      user: 'w09a_crunchie@zohomail.com.au',
      pass: 'SqhY826J9ww4',
    },
  });

  transporter.sendMail({
    from: '"w09a_crunchie" <w09a_crunchie@zohomail.com.au>',
    to: email,
    subject: 'Reset Token w09a_crunchie',
    text: resetToken, // plain text body
  });

  dataStore.users[userIndex].resetCounter++;

  setData(dataStore);

  return { token: resetToken };
}

/**
   * This function generates a reset and sends a user the reset token over email
   *
   * @param {string} resetCode - token of user logging out
   * @param {string} newPassword - the users new password
   * @returns {{}} - if new password sucessful
   * @returns {{ error: string }} - when password to short or token invalid
   */
export function authResetPasswordV1(resetCode: string, newPassword: string) {
  if (newPassword.length < 6) { throw HTTPError(STATUS.BAD_REQUEST, errorString.passwordLength); }
  const dataStore = getData();
  const userIndex = dataStore.users.findIndex(user => user.resetToken === resetCode);
  if (userIndex === INVALID) { throw HTTPError(STATUS.BAD_REQUEST, errorString.passwordIncorrect); }

  dataStore.users[userIndex].resetToken = '';
  dataStore.users[userIndex].password = Base64.stringify(sha256(newPassword));

  setData(dataStore);

  return {};
}
