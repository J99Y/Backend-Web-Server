import { checkToken } from './authV3';
import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import { errorString } from './errors';
import { channelLeaveV2 } from './channelV2';
import { dmLeaveV1 } from './dmV2';
import { messageEditV2 } from './messagesV2';
import { STATUS, INVALID } from './magic_nums';

// -------------------------------- //
// -------  Admin Function -------- //

/**
 *
 * @param token
 * @param uId
 * @returns {} if success remove the user
 * @returns STATUS.BAD_REQUEST Error if uId is not valid / uId refers to the only global owner
 * @returns STATUS.FORBIDDEN Error if the authorised user is not global owner
 */
export function adminUserRemoveV1(token: string, uId: number) {
  const data = getData();
  // Error Handling:
  // check if token is valid
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }
  //  check if uId is valid
  if (data.users.find(user => user.uId === uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotValid);
  }

  // 1.1 check if the uId refer to an active user && token is a active user
  if (isActiveUserUid(tokenId) === false || isActiveUserUid(uId) === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.unActiveUser);
  }

  // check authorisedUser is the global owner
  const authorisedData = data.users.find(user => user.uId === tokenId);
  if (authorisedData.permissionId !== 1) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.tokenNotGlobalOwner);
  }
  // check if uId is the only global owner
  const userData = data.users.find(user => user.uId === uId);
  if (userData.permissionId === 1) {
    if (isOnlyOwner() === true) {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.onlyOneGlobalOwner);
    }
  }
  // make the user no longer active
  userData.isActive = false;
  // 3. update userProfile -- nameFirst = "Removed", nameLast = "user"
  userData.nameFirst = 'Removed';
  userData.nameLast = 'user';
  // delete the email in the email array of Datastore
  const email = data.emails.indexOf(userData.email);
  data.emails.splice(email, 1);
  setData(data);

  // function implemented
  // 1.
  // get all uId's channel
  const userChannel = userData.channelIds.slice();
  // get all message that has the message Id in the channel to "Removed user"
  for (const channelId of userChannel) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    for (const message of channel.messages) {
      // 1.2 find all the message they sent and change the name to "Removed user"
      if (message.uId === uId) {
        messageEditV2(userData.activeTokens[0], message.messageId, 'Removed user');
      }
    }
    // user leave the channel
    channelLeaveV2(userData.activeTokens[0], channelId);
  }

  const userDm = userData.dmIds.slice();
  // get all message that has the message Id in the dm to "Removed user"
  for (const dmId of userDm) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    for (const message of dm.messages) {
      // 1.2 find all the message they sent and change the name to "Removed user"
      if (message.uId === uId) {
        messageEditV2(userData.activeTokens[0], message.messageId, 'Removed user');
      }
    }
    // user leave the dm
    dmLeaveV1(userData.activeTokens[0], dmId);
  }

  // make the user no longer active
  userData.isActive = false;
  // 3. update userProfile -- nameFirst = "Removed", nameLast = "user"
  userData.nameFirst = 'Removed';
  userData.nameLast = 'user';
  // delete the email in the email array of Datastore
  const userEmail = data.emails.indexOf(userData.email);
  data.emails.splice(userEmail, 1);
  // remove active token
  userData.activeTokens = [];
  // remove handleStr
  userData.handleStr = '';
  setData(data);
  return {};
}
/**
 *
 * @param token
 * @param uId
 * @param permissionId
 * @returns {}
 * @returns STATUS.BAD_REQUEST Error - uId not valid
 *                   - uId is the only global owner adn they are beign demoted to a user
 *                   - permissionId is invalid
 *                   - user already has the permissions level of permissionId
 * @retunrs STATUS.FORBIDDEN Error  - authorised user is not a global owner
 */
export function adminUserpermissionChangeV1(token: string, uId: number, permissionId: number) {
  const data = getData();
  // check if token is valid
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }

  // Error handling
  // 1. check if uId is valid
  if (data.users.find(user => user.uId === uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotValid);
  }
  // 1.1 check if the uId refer to an active user
  if (isActiveUserUid(tokenId) === false || isActiveUserUid(uId) === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.unActiveUser);
  }
  // 2. check if permissionId is only 1/0

  if (![1, 2].includes(permissionId)) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.permissionIdNotValid);
  }
  const userData = data.users.find(user => user.uId === uId);

  // 4, check the if user.permissionId = permissionId
  if (userData.permissionId === permissionId) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.userAlreadyhasPermission);
  }

  // 3. if permissionId is 2, check if uId is the only global or not
  if (permissionId === 2 && userData.permissionId === 1) {
    if (isOnlyOwner() === true) {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.onlyOneGlobalOwner);
    }
  }
  // 5. check whether the token given refer to a global Owner
  const authorisedData = data.users.find(user => user.uId === tokenId);
  if (authorisedData.permissionId !== 1) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.tokenNotGlobalOwner);
  }
  // change uId's permissionId
  userData.permissionId = permissionId;
  if (permissionId === 1) {
    userData.globalOwner = true;
  } else {
    userData.globalOwner = false;
  }
  setData(data);
  return {};
}
// given a uId and check if the user is active or not
// return true if the user is active, false if not

export function isActiveUserUid(uId : number) {
  const data = getData();
  const userData = data.users.find(user => user.uId === uId);
  return userData.isActive;
}

// function check if there is only one global owner in Beans
// Return ture if only one Global owner, false if more than one
export function isOnlyOwner() {
  const data = getData();
  let haveOwner = 0;
  // loop through all the user
  for (const user of data.users) {
    if (user.permissionId === 1) {
      haveOwner++;
    }
  }
  // if 1, then there is only one owner
  if (haveOwner === 1) {
    // not the only owner;
    return true;
  }
  // else there are multiple owner in Beans
  return false;
}
