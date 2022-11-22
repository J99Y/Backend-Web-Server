import { checkToken } from './authV3';
import { DataStoreType, getData, setData, UserObject } from './dataStore';
import { getTime } from './other';
import { STATUS, LENGTH, TYPE, INVALID } from './magic_nums';
import { addChannelTagMessageNotification, addDmTagMessageNotification } from './notificationsV1';

import HTTPError from 'http-errors';
import { errorString } from './errors';

interface DecodedMessageId {
  messageType: number,
  id: number,
  messageId: number,
}

// -------------------------------- //
// -------Message Functions-------- //

/**
 * <Function which send a message to a given channel>
 *
 * @param {string} token - user token
 * @param {number} channelId - channelId where message will be sent
 * @param {string} message - message to be sent
 * @returns {{ messageId: number }} - messageId of message sent
 * @returns {{ error: string }} - when channelId is invalid
 *                              - message length not between 1-1000 characters
 *                              - when token is invalid
 *                              - when channelId valid but user not member of channel
 */
export function messageSendV2(token: string, channelId: number, message: string) {
  let dataStore = getData();
  const channel = dataStore.channels.find(channel => channel.channelId === channelId);
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  if (channel === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid);
  }
  if (message.length > LENGTH.MAX_MESSAGE || message.length < LENGTH.MIN_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }
  if (channel.memberIds.find(memberId => memberId === authUserId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }
  const messageId = messageIdGen(TYPE.CHANNEL, channelId);
  channel.messages.unshift({
    messageId: messageId,
    uId: authUserId,
    message: message,
    timeSent: getTime(),
    reacts: [
      {
        reactId: 1,
        uIds: [],
      }
    ],
    isPinned: false,
  });
  // Add notification if there is a tag
  // addChannelTagNotification(dataStore, messageId);
  addChannelTagMessageNotification(dataStore, channelId, message, authUserId);
  dataStore = updateStatsMessages(dataStore, authUserId);
  setData(dataStore);

  return {
    messageId: messageId,
  };
}

/**
 * updates user stats and workSpace stats
 * @param dataStore
 * @param uId
 * @returns dataStore
 */
export function updateStatsMessages(dataStore: DataStoreType, uId: number): DataStoreType {
  const user = dataStore.users.find(a => a.uId === uId);
  addUserMessagesStats(user);
  dataStore.messageCount++;
  dataStore.messages++;
  addWorkPlaceStatsMessages(dataStore);
  return dataStore;
}

/**
 * <Function which edits a given a message>
 *
 * @param {string} token - user token
 * @param {number} messageId - messageIdId of message being edited
 * @param {string} message - message to be edited
 * @returns {{ error: string }} - message length not between 1-1000 characters
 *                              - messageId invalid
 *                              - when token is invalid
 *                              - when message not sent by original/authorised user on channel/dm
 */
export function messageEditV2(token: string, messageId: number, message: string) {
  const dataStore = getData();
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const userObject = dataStore.users.find(user => user.uId === authUserId);
  if (message.length > LENGTH.MAX_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }
  const decodedMessageId = messageIdDecode(messageId);
  if (decodedMessageId === INVALID) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    messageEditChannel(dataStore, decodedMessageId, userObject, message);
    // Add notification if there is a tag
    if (message !== '') {
      addChannelTagMessageNotification(dataStore, decodedMessageId.id, message, authUserId);
    }
  } else if (decodedMessageId.messageType === TYPE.DM) {
    messageEditDm(dataStore, decodedMessageId, userObject, message);
    if (message !== '') {
      addDmTagMessageNotification(dataStore, decodedMessageId.id, message, authUserId);
    }
  }
  return {};
}

/**
 * <Function which removes a given a message>
 *
 * @param {string} token - user token
 * @param {number} messageId - messageIdId of message being edited
 * @returns {{ messageId: number }} - messageId of message being removed
 * @returns {{ error: string }} - messageId invalid
 *                              - when token is invalid
 *                              - when message not sent by original/authorised user on channel/dm
 */
export function messageRemoveV2(token: string, messageId: number) {
  return messageEditV2(token, messageId, '');
}

/**
 * <Function which edits a message in a channel>
 *
 * @param {object} data - current data
 * @param {object} messageId - messageIdId of message being edited
 * @param {object} userObject - user data
 * @param {object} message - message to be edited
 * @throws - STATUS.BAD_REQUEST - message length not between 1-1000 characters
 *         - STATUS.BAD_REQUEST - messageId invalid
 *         - STATUS.FORBIDDEN - when message not sent by original/authorised user on channel/dm
 */
export function messageEditChannel(
  dataStore: DataStoreType,
  decodedMessageId: DecodedMessageId,
  userObject: UserObject,
  message: string) {
  const channelIndex = dataStore.channels.findIndex(channel => channel.channelId === decodedMessageId.id);
  if (channelIndex === -1) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  if (dataStore.channels[channelIndex].memberIds.find(members => members === userObject.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  const messageIndex = dataStore.channels[channelIndex].messages.findIndex(message => message.messageId === decodedMessageId.messageId);
  if (messageIndex === -1) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }

  const messageObject = dataStore.channels[channelIndex].messages[messageIndex];
  if (messageObject.uId !== userObject.uId && userObject.permissionId !== 1 &&
        dataStore.channels[channelIndex].ownerIds.find(owner => owner === userObject.uId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotOwnerMessage);
  }

  if (message.length === 0) {
    dataStore.messages--;
    addWorkPlaceStatsMessages(dataStore);
    dataStore.channels[channelIndex].messages.splice(messageIndex, 1);
  } else {
    messageObject.message = message;
  }
  setData(dataStore);
}

/**
 * <Function which edits a message in a dm>
 *
 * @param {object} data - current data
 * @param {object} messageId - messageIdId of message being edited
 * @param {object} userObject - user data
 * @param {object} message - message to be edited
 * @throws - status STATUS.BAD_REQUEST - message length not between 1-1000 characters
 *         - status STATUS.BAD_REQUEST - messageId invalid
 *         - status STATUS.FORBIDDEN - when message not sent by original/authorised user on channel/dm
 */
export function messageEditDm(
  dataStore: DataStoreType,
  decodedMessageId: DecodedMessageId,
  userObject: UserObject,
  message: string) {
  const dmIndex = dataStore.dms.findIndex(dm => dm.dmId === decodedMessageId.id);
  if (dmIndex === -1) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  if (dataStore.dms[dmIndex].memberUid.find(members => members === userObject.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  const messageIndex = dataStore.dms[dmIndex].messages.findIndex(message => message.messageId === decodedMessageId.messageId);
  if (messageIndex === -1) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }

  const messageObject = dataStore.dms[dmIndex].messages[messageIndex];
  if (messageObject.uId !== userObject.uId && dataStore.dms[dmIndex].creatorUid !== userObject.uId) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotOwnerMessage);
  }

  if (message.length === 0) {
    dataStore.messages--;
    addWorkPlaceStatsMessages(dataStore);
    dataStore.dms[dmIndex].messages.splice(messageIndex, 1);
  } else {
    messageObject.message = message;
  }
  setData(dataStore);
}

/**
 * <Function which generates messageId>
 *
 * @param {number} messageType - (1 - channel, 2 - dm)
 * @param {number} id - channel/dmId where message is being sent
 * @returns {{ messageId: number }} - unique messageId of message
 */
export function messageIdGen(messageType: number, id: number) {
  const dataStore = getData();
  // Whether message is in a dm or channel
  const typeIdentifierDigit = messageType;
  // The id of the channel or dm
  const idIdentifier = id;
  // MessageId incrementor to ensure uniqueness
  const messageIdIdentifier = dataStore.messageCount;

  dataStore.messageCount++;
  setData(dataStore);

  // Message ID consists of the type of the three identifiers concatenanted
  return parseInt('' + typeIdentifierDigit + idIdentifier + 'a' + messageIdIdentifier, 16);
}

/**
 * <Function which decodes messageId>
 *
 * @param {number} codedMessageId - messageId to be decoded
 * @returns {{ messageType: number, id: number, messaegId: number}} - decoded message object
 * @returns {number} - returns -1 if decoded messageId is invalid format
 */
export function messageIdDecode(codedMessageId: number) {
  const messageIdDecoded = codedMessageId.toString(16);
  // Regex checks if Id when converted to HEX matches the format (e.g. 10a1)
  const pattern = /^[12][0-9]+a[0-9]+$/gmi;
  if (pattern.test(messageIdDecoded) === false) {
    return INVALID;
  }

  const messageType = messageIdDecoded[0];
  const id = messageIdDecoded.substring(1, messageIdDecoded.indexOf('a'));

  return {
    messageType: parseInt(messageType),
    id: parseInt(id),
    messageId: codedMessageId,
  };
}

// add message stat when user sends a message
export function addUserMessagesStats(user: UserObject) {
  const messageCreated = Math.floor((new Date()).getTime() / 1000);
  const messagesSent = user.userStats.messagesSent.length;
  const newMessageStat = { numMessagesSent: messagesSent, timeStamp: messageCreated };
  user.userStats.messagesSent.push(newMessageStat);
}

export function addWorkPlaceStatsMessages (dataStore: DataStoreType) {
  const messageCreated = Math.floor((new Date()).getTime() / 1000);
  const newMessageStat = { numMessagesExist: dataStore.messages, timeStamp: messageCreated };
  dataStore.workSpaceStats.messagesExist.push(newMessageStat);
}
