import { getData } from './dataStore';
import { checkToken } from './authV3';

import HTTPError from 'http-errors';
import { errorString } from './errors';
import { INVALID, STATUS } from './magic_nums';

// -------------------------------- //
// ---------User Functions--------- //

interface UserProfileV2Return {
  user?: {
    uId: number,
    email: string,
    nameFirst: string,
    nameLast: string,
    handleStr: string
    profileImgUrl: string
  }
  error?: string
}

/**
 * <Function which returns userProfile of given userId>
 *
 * @param {string} token - user token
 * @param {number} uId - uId of profile to be returned
 * @returns {{ user }} - userObject
 * @returns {{ error: string }} - when uId is invalid
 *                              - when token is invalid
 */
export function userProfileV3(token: string, uId: number): UserProfileV2Return {
  const data = getData();
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }

  if (data.users.find(user => user.uId === uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotValid);
  }

  const userData = data.users.find(user => user.uId === uId);
  const userProfile = {
    user: {
      uId: userData.uId,
      email: userData.email,
      nameFirst: userData.nameFirst,
      nameLast: userData.nameLast,
      handleStr: userData.handleStrDisplay,
      profileImgUrl: userData.profilePhoto
    }
  };

  return userProfile;
}
