import { setData, getData, ChannelObject, DataStoreType, Notification } from './dataStore';
import { checkToken } from './authV3';
import { userProfileV3 } from './userV3';
import { channelIndex, isChannelMember, addUserChannelStats } from './channelsV3';
import { errorString, ReturnError } from './errors';
import HTTPError from 'http-errors';
import { STATUS, LENGTH, INVALID } from './magic_nums';
import { isActiveUserUid } from './adminV1';

// -------------------------------- //
// -------Channels Functions------- //

function getHandleStr(uId: number) {
  const dataStore = getData();
  for (const user of dataStore.users) {
    if (user.uId === uId) {
      return user.handleStr;
    }
  }
}

/**
 * <Returns channelProfile of given channelId>
 *
 * @param {number} channelId - channelId to be searched
 * @returns {{ channel }} - channelProfile object
 * @returns {{ error: string }} - when channelId invalid
 */
function channelProfile(channelId: number): ChannelObject | ReturnError {
  const dataStore = getData();
  const channel = dataStore.channels.find((channel) => channel.channelId === channelId);

  if (channel === undefined) { return { error: errorString.chanIdNotValid }; }
  return channel;
}

export interface Members {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string,
}

interface ReturnChannelDetails {
  name: string;
  isPublic: boolean,
  ownerMembers: Members[],
  allMembers: Members[],
}

/**
 * <Valid token and channelId will return object containing the details of channel>
 * @param {string} token - user token
 * @param {number} channelId - channelId to be searched
 * @returns {{ name: string, isPublic: boolean, ownerMembers: [], allMembers: [] }} - channel details object
 * @returns {{ error: string }} - when channelId invalid
 *                              - when token is invalid
 *                              - when user is not a member of channel
 */
export function channelDetailsV3 (token: string, channelId: number): ReturnChannelDetails | ReturnError {
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const channel = channelProfile(channelId);
  if ('error' in channel) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }

  const isMember = channel.memberIds.find(uId => uId === authUserId);
  if (isMember === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }

  const details: ReturnChannelDetails = {
    name: channel.channelName,
    isPublic: channel.isPublic,
    ownerMembers: [],
    allMembers: [],
  };

  for (const ownerId of channel.ownerIds) {
    details.ownerMembers.push(userProfileV3(token, ownerId).user);
  }

  for (const memberId of channel.memberIds) {
    details.allMembers.push(userProfileV3(token, memberId).user);
  }

  return details;
}

/**
 * <A function that allows users to join a specific channel>
 *
 * @param {string} token - user token
 * @param {number} channelId - channelId of the channel to be joined
 * @returns {{}} - if channel joined successfully
 * @returns {{ error: string }} - when channelId invalid
 *                              - when authUserId is already a member of channel
 *                              - when channel is private and user is not member or global owner
 *                              - when token is invalid
 */
export function channelJoinV3(token: string, channelId: number) {
  const dataStore = getData();
  // Check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if channelId is valid
  if (getChannelObjectFromId(channelId, dataStore) === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }
  // check if the user is already a member in the channel
  if (isChannelMember(authUserId, channelId)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdAlreadyMember); }
  // check if the channel is private and the user is a global owner
  if (dataStore.channels[channelIndex(channelId)].isPublic !== true && getUserObjectFromId(authUserId, dataStore).permissionId === 2) { throw HTTPError(STATUS.FORBIDDEN, errorString.chanPrivateuIDnotOwner); }

  // add the user to the channel all members array
  dataStore.channels[channelIndex(channelId)].memberIds.push(authUserId);
  // adds channelId to user's channel array in datastore
  for (const user of dataStore.users) {
    if (user.uId === authUserId) {
      user.channelIds.push(channelId);
      break;
    }
  }
  const newUser = dataStore.users.find(a => a.uId === authUserId);
  addUserChannelStats(newUser);
  setData(dataStore);
  return {};
}

/**
 * A function that a allows users to invite other users to their channel
 * @param {string} token - token to validate the user who requests an invite
 * @param {number} channelId - id for the channel of interest
 * @param {number} uId - the invite member to the channel
 * @returns {{}} - if a valid invite is sent
 * @returns {{ error: string }} - when channelId invalid
 *                              - when uId is invalid
 *                              - when uId is already a member of the channel
 *                              - when authUser is not a member of the channel
 *                              - when token is invalid
 */
export function channelInviteV3(token: string, channelId: number, uId: number) {
  const dataStore = getData();
  // Check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if uId is valid
  userProfileV3(token, uId);

  // 1.1 check if the uId refer to an active user
  if (isActiveUserUid(uId) === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.unActiveUser);
  }
  // check if channelId is valid
  if (getChannelObjectFromId(channelId, dataStore) === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }
  // check if invited userId is already a member of channel
  if (isChannelMember(uId, channelId)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdAlreadyMember); }
  // check if authUserId not part of the channel
  if (isChannelMember(authUserId, channelId) === false) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }
  // add the invited user to the channel

  dataStore.channels[channelIndex(channelId)].memberIds.push(uId);
  // add channelId to user's channel member arrays
  for (const user of dataStore.users) {
    if (user.uId === uId) {
      user.channelIds.push(channelId);
      break;
    }
  }
  const userToAddNotification = dataStore.users.find(user => user.uId === uId);
  const newNotification: Notification = {
    channelId: channelId,
    dmId: INVALID,
    notificationMessage: `${getHandleStr(authUserId)} added you to ${dataStore.channels[channelIndex(channelId)].channelName}`,
  };
  userToAddNotification.notifications.unshift(newNotification);
  // add channel stats to user object
  const newUser = dataStore.users.find(a => a.uId === authUserId);
  addUserChannelStats(newUser);
  setData(dataStore);
  return {};
}

/**
 * <A function that displays up to 50 messages from a given 'start' message index in a specified channel>
 *
 * @param {string} token - user token
 * @param {number} channelId - channel from which messages are to be viewed
 * @param {number} start - which message index to start at
 * @returns {{ messages: [], start: number, end: number }} object of array of messages and start/end index
 * @returns {{ error: string }} - when channelId invalid
 *                              - when start is greater than number of messages in channel
 *                              - when token is invalid
 *                              - when user is not member of channel
 */
export function channelMessagesV3(token: string, channelId: number, start: number) {
  const dataStore = getData();

  // check if token is valid
  const tokenResult = checkToken(token);
  if (tokenResult === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if channelId is in dataStore
  const channel = dataStore.channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }

  // check for if message length is valid
  if (channel.messages.length < start) { throw HTTPError(STATUS.BAD_REQUEST, errorString.startValInvalid); }

  // check if userId is part of channel and can access messages
  if (channel.memberIds.find(uId => uId === tokenResult) === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }

  let end = start + LENGTH.MAX_MESSAGES_SHOWN;
  const numberOfMessages = channel.messages.length;
  if ((numberOfMessages - start) <= LENGTH.MAX_MESSAGES_SHOWN) {
    end = -1;
  }

  const messagesArray = [];
  let messageIndex = start;
  while (messageIndex < (start + LENGTH.MAX_MESSAGES_SHOWN) && messageIndex + 1 <= numberOfMessages) {
    const messageObject = {
      messageId: channel.messages[messageIndex].messageId,
      uId: channel.messages[messageIndex].uId,
      message: channel.messages[messageIndex].message,
      timeSent: channel.messages[messageIndex].timeSent,
      reacts: channel.messages[messageIndex].reacts,
      isPinned: channel.messages[messageIndex].isPinned,
    };
    for (const react in channel.messages[messageIndex].reacts) {
      if (channel.messages[messageIndex].reacts[react].uIds.includes(tokenResult)) {
        channel.messages[messageIndex].reacts[react].isThisUserReacted = true;
      } else {
        channel.messages[messageIndex].reacts[react].isThisUserReacted = false;
      }
    }
    messagesArray.push(messageObject);
    messageIndex++;
  }

  return {
    messages: messagesArray,
    start: start,
    end: end,
  };
}

/**
 * <Retrieves user object from userId if in dataStore>
 *
 * @param {number} uId - uId to be found
 * @param {{ dataStore }} - dataStore to be searched
 * @returns {{ user }} - user profile object
 * @returns {undefined} - when uId not found
 */
function getUserObjectFromId(userId: number, dataStore: DataStoreType) {
  return dataStore.users.find(({ uId }) => uId === userId);
}

/**
 * <Retrieves channel object from channelId if in dataStore>
 *
 * @param {number} channelId - channelId to be found
 * @param {{ dataStore }} - dataStore to be searched
 * @returns {{ channel }} - user profile object
 * @returns {undefined} - when channelId not found
 */
function getChannelObjectFromId(chanId : number, dataStore : DataStoreType) {
  return dataStore.channels.find(({ channelId }) => channelId === chanId);
}
