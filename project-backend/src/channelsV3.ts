import { getData, setData, ChannelObject, UserObject, DataStoreType } from './dataStore';
import { checkToken } from './authV3';
import HTTPError from 'http-errors';
import { STATUS, LENGTH, INVALID } from './magic_nums';
import { errorString, ReturnError } from './errors';

// -------------------------------- //
// -------Channels Functions------- //

interface ChannelsCreateV2Return {
  channelId?: number
  error?: string
}

interface ChannelList {
  channelId: number,
  name: string,
}
interface ReturnChannelsList {
  channels: ChannelList[]
}

/**
 * <Creates a channel when provided with valid userId, name of channel and whether channel should be
 * public or private>
 *
 * @param {string} token - channel creator's session token
 * @param {string} name - channel name
 * @param {boolean} isPublic - make channel public
 * @returns {{ channelId: number }} - object containing channelId
 * @returns {{ error: string }} - when length less than 1 and more than 20
 *                              - when token is invalid
 */
export function channelsCreateV3(token: string, name: string, isPublic: boolean): ChannelsCreateV2Return {
  const dataStore = getData();
  // Error Handling:

  // use validate function
  if (name.length < LENGTH.MIN_CHANNEL_NAME) { throw HTTPError(STATUS.BAD_REQUEST, errorString.channelNameLength); }
  if (name.length > LENGTH.MAX_CHANNEL_NAME) { throw HTTPError(STATUS.BAD_REQUEST, errorString.channelNameLength); }

  // check if token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // storing into info to create object
  const length: number = dataStore.channels.length;
  const channelObject: ChannelObject = {
    channelId: length,
    channelName: name,
    isPublic: isPublic,
    memberIds: [authUserId],
    ownerIds: [authUserId],
    messages: [],
    standup: { isStandupActive: false, timeFinish: null, uIdStart: null, standupMessages: [] }
  };

  // Store the channel info to dataStore;
  dataStore.channels.push(channelObject);

  // push channelsId to user that create it
  const creator = dataStore.users.find(a => a.uId === authUserId);
  creator.channelIds.push(length);
  creator.ownedChannelIds.push(length);

  // updates the stats for user and workspace
  addUserChannelStats(creator);
  addWorkPlaceChannelStats(dataStore);
  setData(dataStore);

  return {
    channelId: length,
  };
}

/**
 * <Provides object channels containing all channels the userId is part of returns error object when provided invalid userId>
 *
 * @param {string} token - user token
 * @returns {{ channels: [] }} - array of channels objects that user is part of
 * @returns {{ error: string }} - when token is invalid
 */
export function channelsListV3(token: string): ReturnChannelsList | ReturnError {
  const dataStore = getData();

  // Error Handling:
  // check if token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // create array for return
  const authorised: ReturnChannelsList = {
    channels: [],
  };

  // loop through all the channel in dataStore
  for (const channel of dataStore.channels) {
    if (isChannelMember(authUserId, channel.channelId)) {
      const channelList = {
        channelId: channel.channelId,
        name: channel.channelName,
      };
      authorised.channels.push(channelList);
    }
  }

  return authorised;
}

/**
 * <Returns list of all channels (+ private) containing brief details>
 *
 * @param {string} token - user token
 * @returns {{ channels: [] }} - array of channels object of all channels
 * @returns {{ error: string }} - when token is invalid
 */
export function channelsListAllV3 (token: string): ReturnChannelsList {
  const dataStore = getData();
  // check if token is valid
  const user = checkToken(token);
  if (user === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  const allChannels: ReturnChannelsList = {
    channels: [],
  };
  // push all channels into object array
  for (const channel of dataStore.channels) {
    const channelDetail = {
      channelId: channel.channelId,
      name: channel.channelName,
    };
    allChannels.channels.push(channelDetail);
  }
  return allChannels;
}

/**
 * <Checks if userId is member of channelId>
 *
 * @param {number} authUserId - user to be searched
 * @param {number} channelId - channel to be searched
 * @returns {boolean} isMember - true if user is a member
 */
export function isChannelMember(authUserId: number, channelId: number): boolean {
  const dataStore = getData();
  for (let i = 0; i < dataStore.channels[channelIndex(channelId)].memberIds.length; i++) {
    if (dataStore.channels[channelIndex(channelId)].memberIds[i] === authUserId) {
      return true;
    }
  }

  return false;
}

/**
 * <Finds channelIndex from channelId>
 *
 * @param {number} channelId - channelId to be searched
 * @returns {number} channelIndex - channelIndex correspsonding to channelId
 */
export function channelIndex(authUserid: number): number {
  const dataStore = getData();

  return dataStore.channels.findIndex(x => { return x.channelId === authUserid; });
}

/**
 * updates user's stat's when they create or join a channel
 * @param user
 */
export function addUserChannelStats(user: UserObject) {
  const channelCreated = Math.floor((new Date()).getTime() / 1000);
  const newChannelStat = { numChannelsJoined: (user.channelIds.length), timeStamp: channelCreated };
  user.userStats.channelsJoined.push(newChannelStat);
}

/**
 * updates the workspace stat's when channel is created
 * @param dataStore
 */
export function addWorkPlaceChannelStats(dataStore: DataStoreType) {
  const channelCreated = Math.floor((new Date()).getTime() / 1000);
  const newChannelStat = { numChannelsExist: (dataStore.channels.length), timeStamp: channelCreated };
  dataStore.workSpaceStats.channelsExist.push(newChannelStat);
}
