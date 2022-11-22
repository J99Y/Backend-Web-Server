import { getData, setData, DmObject, DataStoreType, Message, UserObject, Notification } from './dataStore';
import { userProfileV3 } from './userV3';
import { checkToken } from './authV3';
import { getTime } from './other';
import { messageIdGen, updateStatsMessages } from './messagesV2';
import { Members } from './channelV3';
import HTTPError from 'http-errors';
import { errorString, ReturnError } from './errors';
import { LENGTH, STATUS, INVALID, TYPE } from './magic_nums';
import { addDmTagMessageNotification } from './notificationsV1';
// import { isMemberName } from 'typescript';

// -------------------------------- //
// ----------Dm Functions---------- //

function getHandleStr(uId: number) {
  const dataStore = getData();
  for (const user of dataStore.users) {
    if (user.uId === uId) {
      return user.handleStr;
    }
  }
}

interface DmCreateReturn {
  dmId?: number;
  error?: string;
}

/**
 * <Function which creates a new Dm chat with given uIds>
 *
 * @param {string} token - creator user token
 * @param {number[]} uIds - list of uIds to be added
 * @returns {{ dmId: number }} - number - valid return
 * @returns {{ error: string }} - when any uId in uIds does not refer to valid user
 *                              - when duplicates exist in uIds
 *                              - when token is invalid
 */
function dmCreateV1(token: string, uIds: number[]): DmCreateReturn | ReturnError {
  // check if all uid in uIds are valid
  for (const uId of uIds) {
    userProfileV3(token, uId);
  }

  // check if duplicates exist in uIds

  if (uIds.length > new Set(uIds).size) { throw HTTPError(STATUS.BAD_REQUEST, errorString.duplicateUIds); }

  // check if token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // Generate name for the Dm
  const dataStore: DataStoreType = getData();
  const allhandleStr = [];

  // A loop that put all the uId's user-handle to a new array of stirng
  for (const uId of uIds) {
    const handleStr = gethandleStr(uId);
    allhandleStr.push(handleStr);
  }
  // add the creator handleStr to the array
  allhandleStr.push(gethandleStr(authUserId));
  // use sort() to sort the funciton
  allhandleStr.sort();

  // convert array of string into string using array.split(""),
  const dmName = allhandleStr.join(', ');

  const dmId = dataStore.dmCount;
  dataStore.dmCount++;
  // Create new dm and put info into the object
  const newdm: DmObject = {
    dmId: dmId,
    dmName: dmName,
    memberUid: uIds,
    creatorUid: authUserId,
    messages: [],
  };
  // push in the creator uId into the memberUid array
  newdm.memberUid.unshift(authUserId);
  dataStore.dms.push(newdm);
  // updata info of every user's dm the have
  for (const uId of uIds) {
    const user = dataStore.users.find(a => a.uId === uId);
    user.dmIds.push(dmId);
    addUserDmStats(user);
  }
  for (const uId of uIds) {
    const userToAddNotification = dataStore.users.find(user => user.uId === uId);
    const newNotification: Notification = {
      channelId: INVALID,
      dmId: newdm.dmId,
      notificationMessage: `${getHandleStr(authUserId)} added you to ${newdm.dmName}`,
    };
    userToAddNotification.notifications.unshift(newNotification);
  }
  // for the owner push dmId in its ownerDmIds
  const owner = dataStore.users.find(a => a.uId === authUserId);
  owner.ownedDmIds.push(dmId);
  addWorkPlaceDmStats(dataStore);
  setData(dataStore);

  return { dmId: dmId };
}

interface DmLeaveReturn {
  error?: string;
}

/**
 * <Removes dm from datastore>
 *
 * @param {string} token - user token
 * @param {number} dmId - dmId to be removed
 * @returns {{}} - on successful removal
 * @returns {{ error: string }} - when dmId invalid
 *                              - when dmId is valid but user is not original Dm creator
 *                              - when token invalid
 *                              - when dmId valid but user no longer in the Dm
 */
function dmRemoveV1(token: string, dmId: number): DmLeaveReturn {
  let data = getData();
  // check if dmId is valid
  const dmIndex = dmObject(dmId);
  if ('error' in dmIndex) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }

  // check if valid token
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if token is the owner of dmId
  if (isOwner(dmId, authUserId) === false) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdsNotDmOwner); }
  // checks if owner is member of dm
  const result = dmMemberUid(dmId, authUserId);
  if (result === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.OwnerAlreadyLeave); }
  // find the dm in dataStore.dms, and get the memberUid array
  addWorkPlaceDmRemoveStats(data, dmId);
  const indexOfdm = data.dms.findIndex(dm => dm.dmId === dmId);

  const dm = data.dms[indexOfdm];
  // loop through all the memeber uid and delete the member and updata their user info.
  for (const member of dm.memberUid) {
    data = removeUserdm(dmId, member, data);
  }
  data = removeDmOwned(dmId, authUserId, data);
  // delete the entire dm object in the dataStore.dms
  data.dms.splice(indexOfdm, 1);
  addWorkPlaceDmStats(data);
  setData(data);
  return {};
}

/**
 * <Removes user from Dm>
 *
 * @param {string} token - user to be removed token
 * @param {number} dmId - dmId to be removed from
 * @returns {{}} - on successful leave
 * @returns {{ error: string }} - when dmId is invalid
 *                              - when token is invalid
 *                              - when dmId valid but user not member of Dm
 */
function dmLeaveV1(token: string, dmId: number): DmLeaveReturn {
  let dataStore: DataStoreType = getData();
  // check if token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if dmId is valid
  const dmIndex = dmObject(dmId);
  if ('error' in dmIndex) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }

  // check if token refer to user in the dm.memberUid
  const result = dmMemberUid(dmId, authUserId);
  if (result === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }
  // find the index of the member inside memberUid
  const dmObj = dataStore.dms.find(dm => dm.dmId === dmId);
  const userIndex = dmObj.memberUid.findIndex(uId => {
    return uId === authUserId;
  });
  // delete the member in memberUid
  dmObj.memberUid.splice(userIndex, 1);
  // remove the dmId from their user.dmIds array
  dataStore = removeUserdm(dmId, authUserId, dataStore);
  //   remove dmId from their user.ownedDmId
  dataStore = removeDmOwned(dmId, authUserId, dataStore);
  setData(dataStore);
  return {};
}

interface DmSendV1Return {
  messageId: number;
}

/**
 * <Send message to a dm>
 *
 * @param {string} token - user token
 * @param {number} dmId - dmId for message to be sent to
 * @param {string} message - string of message to be sent
 * @returns {{ messageId: number }} - messageId of messages sent
 * @returns {{ error: string }} - when dmId is invalid
 *                              - message length not between 1-1000 characters
 *                              - when token is invalid
 *                              - when dmId valid but user not member of Dm
 */
function dmSendV2(token: string, dmId: number, message: string): ReturnError | DmSendV1Return {
  // check token is valid
  const user = checkToken(token);
  if (user === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if message is of valid length
  if (message.length < LENGTH.MIN_MESSAGE || message.length > LENGTH.MAX_MESSAGE) { throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength); }

  // checks if dmId is valid
  const dm = dmObject(dmId);
  if ('error' in dm) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }

  let dataStore = getData();
  // checks if userId assocaited with token part of dm
  const result = dm.memberUid.find(a => a === user);
  if (result === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }

  // valid inputs
  const newMessage = dataStore.dms.find(a => a.dmId === dmId);
  const messageId = messageIdGen(TYPE.DM, dmId);
  newMessage.messages.unshift(
    {
      messageId: messageId,
      uId: user,
      message: message,
      timeSent: getTime(),
      reacts: [
        {
          reactId: 1,
          uIds: [],
        }
      ],
      isPinned: false,
    }
  );
  // addDmTagNotification(dataStore, messageId);
  addDmTagMessageNotification(dataStore, dmId, message, user);
  dataStore = updateStatsMessages(dataStore, user);
  setData(dataStore);
  return { messageId: messageId };
}

// add message stat when user sends a message

interface DmListObj {
  dmId: number,
  name: string,
}

interface DmListV2Return {
  dms: DmListObj[],
}

/**
 * <Returns lists of dms user id part of>
 *
 * @param {string} token - user token
 * @returns {{ dms: [] }} - list of all dms user is a part of
 * @returns {{ error: string }} - when token is invalid
 */
function dmListV2(token: string): ReturnError | DmListV2Return {
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const dataStore = getData();
  const user = dataStore.users.find(a => a.uId === authUserId);

  const list: DmListV2Return = { dms: [] };
  for (const dmChannel of user.dmIds) {
    const dmChannelDetail = dataStore.dms.find(a => a.dmId === dmChannel);
    list.dms.push(
      {
        dmId: dmChannelDetail.dmId,
        name: dmChannelDetail.dmName,
      }
    );
  }
  return list;
}

interface ReturnDmDetails {
  name: string,
  members: Members[],
}

/**
 * <Returns the dm's name and members on success>
 *
 * @param {string} token - user token
 * @param {number} dmId - dmId to be searched for
 * @returns {{ name: string, members: members[] }} - object with list of dms
 * @returns {{ error: string }} - when dmId is invalid
 *                              - when token is invalid
 *                              - when user is not a member of dm
 */
function dmDetailsV1 (token: string, dmId: number): ReturnDmDetails | ReturnError {
  // checks if user is in dataStore store
  // if "error" key in object then userId not valid and returns error object
  // let result = dataStore.users.find(({uId}) => uId === authUserId);
  // if ('error' in userProfileV1(authUserId, authUserId)) { return { error: errorString.uIdNotValid }; }
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  // checks if channel is in dataStore store
  // if undefined is returned then invalid channelId and returns error object
  const dm = dmObject(dmId);
  if ('error' in dm) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }

  // checks if user is in channel
  // 1. get the channel object using function getChannelObject
  // 2. access the membersIds array and see if authUserId is in array
  // 3. if not then user is not a member and an error object will be returned
  const isMember = dm.memberUid.find(uId => uId === authUserId);
  if (isMember === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }

  const details: ReturnDmDetails = {
    name: dm.dmName,
    members: [],
  };

  // 1. goes through memberIds array of channel object
  // 2. retrieves userObject from Ids
  // 3. new object created with relevant keys/values
  // 4. pushed into the allMembers array for return
  for (const memberId of dm.memberUid) {
    details.members.push(userProfileV3(token, memberId).user);
  }
  return details;
}

interface ReturnMessages {
  messages: Message[],
  start: number,
  end: number,
}

/**
 * <Displays the messages of the dm>
 *
 * @param {string} token - user token
 * @param {number} dmId - dmId to be searched
 * @param {number} start - message index to start displaying messages at
 * @returns {{ messages: [], start: number, end: number }} object of array of messages and start/end index
 * @returns {{ error: string }} - when dmId invalid
 *                              - when start is greater than number of messages in dm
 *                              - when token is invalid
 *                              - when user is not member of dm
 */
function dmMessagesV2(token: string, dmId: number, start: number): ReturnError | ReturnMessages {
  const dataStore = getData();

  // checks if token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if dmId is valid
  const dm = dataStore.dms.find(dm => dm.dmId === dmId);
  if (dm === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }

  // check for if message length is valid
  if (dm.messages.length < start) { throw HTTPError(STATUS.BAD_REQUEST, errorString.startValInvalid); }

  // check if userId is part of dm and can access messages
  if (dm.memberUid.find(uId => uId === authUserId) === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }

  let end = start + LENGTH.MAX_MESSAGES_SHOWN;
  const numberOfMessages = dm.messages.length;
  if ((numberOfMessages - start) <= LENGTH.MAX_MESSAGES_SHOWN) {
    end = -1;
  }

  const messagesArray = [];
  let messageIndex = start;
  while (messageIndex < (start + LENGTH.MAX_MESSAGES_SHOWN) && messageIndex + 1 <= numberOfMessages) {
    // const reacted = isReacted(authUserId, dm.messages[messageIndex].reacts);
    const messageObject = {
      messageId: dm.messages[messageIndex].messageId,
      uId: dm.messages[messageIndex].uId,
      message: dm.messages[messageIndex].message,
      timeSent: dm.messages[messageIndex].timeSent,
      reacts: dm.messages[messageIndex].reacts,
      isPinned: dm.messages[messageIndex].isPinned,
    };
    // add the isUserReacted boolean to react object
    for (const react in dm.messages[messageIndex].reacts) {
      if (dm.messages[messageIndex].reacts[react].uIds.includes(authUserId)) {
        dm.messages[messageIndex].reacts[react].isThisUserReacted = true;
      } else {
        dm.messages[messageIndex].reacts[react].isThisUserReacted = false;
      }
    }
    messagesArray.push(messageObject);
    messageIndex++;
  }

  const messagesObject : ReturnMessages = {
    messages: messagesArray,
    start: start,
    end: end,
  };

  return messagesObject;
}

/**
 * <Checks if dmId is valid>
 *
 * @param {number} dmId - dmId object to be found
 * @returns {dmObject} - dmObject corresponding to dmId
 * @returns {{error: string}} - when dmId is invalid
 */
function dmObject(dmId: number): DmObject | ReturnError {
  const dataStore = getData();
  const result = dataStore.dms.find(dm => dm.dmId === dmId);
  if (result === undefined) { return { error: errorString.invalidDmId }; }

  return result;
}

/**
 * <Given member's uid and returns their handleStr>
 *
 * @param {number} uId - userId
 * @returns {{handleStr: string}} - handleStr object
 */
function gethandleStr(uId:number): string {
  const dataStore = getData();
  let index = 0;

  while (index < dataStore.users.length) {
    if (dataStore.users[index].uId === uId) {
      break;
    } else {
      index++;
    }
  }

  const handleStr = dataStore.users[index].handleStrDisplay;

  return handleStr;
}

/**
 * <Checks if the user we want to removed is in the dm.memberUid, gives their userIndex>
 *
 * @param {number} dmId - dmId to be searched
 * @param {number} uId - userId to be searched
 * @returns {number}: index if in memberUid
 * @returns {number}: -1 if not a member of dm
 */
function dmMemberUid(dmId: number, uId: number): number {
  const dataStore = getData();
  const result = dataStore.dms.findIndex(object => {
    return object.dmId === dmId;
  });
  const index = dataStore.dms[result].memberUid.indexOf(uId);
  return index;
}

/**
 * <This function remove the give dmId from user's dmIds array>
 * @param {number} dmId - dmId to be removed
 * @param {number} uId - uId to be found
 */
function removeUserdm (dmId: number, uId: number, data: DataStoreType) {
  // get the index of user in dataStore.users
  const user = data.users.find(user => user.uId === uId);
  // search in its dmIds array and get index the dmId to delete
  const indexDmId = user.dmIds.indexOf(dmId);
  // delete the dmId and push a new array to its dmIds
  user.dmIds.splice(indexDmId, 1);
  addUserDmLeaveStats(user);
  return data;
}

/**
 * <This function remove the given dmId from users' ownedDmIds array>
 * @param {number} dmId - dmId to be removed
 * @param {number} uId - uId to be found
 */
function removeDmOwned (dmId: number, uId: number, data: DataStoreType) {
  // get the object of user in datatore.users
  const user = data.users.find(user => user.uId === uId);
  // search in its dmIds array and get index the dmId to delete
  const indexDmId = user.ownedDmIds.indexOf(dmId);
  // delete the dmId and push a new array to its dmIds
  user.ownedDmIds.splice(indexDmId, 1);
  // user.ownedDmIds.filter(uId => uId !== dmId);
  return data;
}

/**
 * Return true of false, whether uId is the owner of the dm
 * @param {number} dmId - dmId to be searched
 * @param {number} uId - uId to be found
 */
function isOwner(dmId: number, uId: number) {
  const data = getData();
  // find the dm object
  const dm = data.dms.find(dm => dm.dmId === dmId);
  // search in its dmIds array and get index the dmId to delete

  if (dm.creatorUid === uId) {
    return true;
  }
  return false;
}

// add stat to user object when they leave dm or dm is removed
function addUserDmLeaveStats(user: UserObject) {
  const dmLeft = Math.floor((new Date()).getTime() / 1000);
  const newDmStat = { numDmsJoined: (user.dmIds.length), timeStamp: dmLeft };
  user.userStats.dmsJoined.push(newDmStat);
}

function addWorkPlaceDmRemoveStats (dataStore: DataStoreType, dmId: number) {
  const dm = dataStore.dms.find(a => a.dmId === dmId);
  const messages = dm.messages.length;
  dataStore.messages = dataStore.messages - messages;
  const dmRemoved = Math.floor((new Date()).getTime() / 1000);
  const newMessageStat = { numMessagesExist: dataStore.messages, timeStamp: dmRemoved };
  dataStore.workSpaceStats.messagesExist.push(newMessageStat);
}

function addWorkPlaceDmStats(dataStore: DataStoreType) {
  const dmCreated = Math.floor((new Date()).getTime() / 1000);
  const newDmStat = { numDmsExist: (dataStore.dms.length), timeStamp: dmCreated };
  dataStore.workSpaceStats.dmsExist.push(newDmStat);
}

function addUserDmStats(user: UserObject) {
  const dmCreated = Math.floor((new Date()).getTime() / 1000);
  const newDmStat = { numDmsJoined: (user.dmIds.length), timeStamp: dmCreated };
  user.userStats.dmsJoined.push(newDmStat);
}

export { dmCreateV1, dmRemoveV1, dmLeaveV1, dmSendV2, dmListV2, dmDetailsV1, dmMessagesV2, dmObject };
