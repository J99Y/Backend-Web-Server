import { ChannelObject, getData, setData, UserObject } from './dataStore';
import { userProfileV3 } from './userV3';
import { errorString, ReturnError } from './errors';
import { checkToken } from './authV3';
import { INVALID, STATUS } from './magic_nums';
import HTTPError from 'http-errors';

/**
 * A function that returns the channel object with a specific channelId
 * @param {number} channelId - the channelId for the channel of interest
 * @returns {{ ChannelObject }} - the channelId is a valid Id that refers to a channel that exists
 * @returns {{ error: string }} - Returns an error object if the channelId is invalid
 */
function channelProfile(channelId: number): ChannelObject | ReturnError {
  const dataStore = getData();
  const channel = dataStore.channels.find((channel) => channel.channelId === channelId);

  if (channel === undefined) { return { error: errorString.chanIdNotValid }; }
  return channel;
}

/**
 * A function that allows users in a channel to leave that channel
 * @param {string} token - user token
 * @param {number} channelId - channelId of the channel of interest
 * @returns {{}} - If the user successfully leaves
 * @returns {{ Status Code 400 }} - if the channleId is invalid
 * @returns {{ Status Code 403 }} - if the token is invalid
 *                                - if the user is already not part of the channel
 */
function channelLeaveV2(token: string, channelId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if channelId is valid
  let channelToLeave = channelProfile(channelId);
  if ('error' in channelToLeave) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }

  // Remove user from the channel if they are part of the channel
  if (channelToLeave.memberIds.includes(authUserId)) {
    // Check they aren't the start of an active standup
    if (channelToLeave.standup.uIdStart === authUserId) { throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdStandupStarter); }
    // Remove user from channel members array
    channelToLeave = dataStore.channels.find(channel => channel.channelId === channelId);
    let userIndex = channelToLeave.memberIds.indexOf(authUserId);
    channelToLeave.memberIds.splice(userIndex, 1);

    // Remove channelId from Userobject
    const userObject = dataStore.users.find(user => user.uId === authUserId);
    const channelIndex = userObject.channelIds.indexOf(channelId);
    userObject.channelIds.splice(channelIndex, 1);

    // adds channel stats to user object
    addUserChannelLeaveStats(userObject);
    // Check if user is in the owners array and if so remove them
    if (channelToLeave.ownerIds.includes(authUserId)) {
      // Remove user from the ownerIds array in the channel object
      userIndex = channelToLeave.ownerIds.indexOf(authUserId);
      channelToLeave.ownerIds.splice(userIndex, 1);

      // Remove channelId from userObject ownedChannelIds
      const userObjectOwnedChannelIndex = userObject.ownedChannelIds.indexOf(channelId);
      userObject.ownedChannelIds.splice(userObjectOwnedChannelIndex, 1);

      setData(dataStore);
      return {};
    } else {
      setData(dataStore);
      return {};
    }
  } else {
    // Return error if authenticated user isn't a channel member
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }
}

// add channel stats to user upon joining
function addUserChannelLeaveStats(user: UserObject) {
  const channelLeft = Math.floor((new Date()).getTime() / 1000);
  const newChannelStat = { numChannelsJoined: (user.channelIds.length), timeStamp: channelLeft };
  user.userStats.channelsJoined.push(newChannelStat);
}

/**
 * A function that a allows owners to give channel members owner permissions
 * @param {string} token - token to validate the user who requests to add an owner
 * @param {number} channelId - id for the channel of interest
 * @param {number} uId - the member of the channel to become an owner
 * @returns {{}} - if the member is successfully given owner permissions
 * @returns {{ Status Code STATUS.FORBIDDEN }} - when channelId invalid
 *                                - when uId is invalid
 *                                - when uId is not a member of the channel
 *                                - when uId already has owner permissions
 * @returns {{ Status Code STATUS.BAD_REQUEST }} - when token is invalid
 *                                - when authUser is not a member of the channel
 *                                - authUser doesn't have owner permissions
 */
function channelAddOwnerV2(token: string, channelId: number, uId: number) {
  // check token is valid
  const dataStore = getData();
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  // check if channelId is valid
  let channelToAdd = channelProfile(channelId);
  if ('error' in channelToAdd) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }
  // check uId is valid
  userProfileV3(token, uId);
  // check if userId is a member of the channel
  if (channelToAdd.memberIds.includes(uId) === false) { throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember); }

  // check if authUserId is part of the channel
  if (channelToAdd.memberIds.includes(authUserId) === false) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }
  // Check if the authUser has owner permissions
  // Check is authUser is the global owner
  const authUser = dataStore.users.find(user => user.uId === authUserId);
  const userToAdd = dataStore.users.find(user => user.uId === uId);
  if (channelToAdd.ownerIds.includes(authUserId) || authUser.globalOwner === true) {
    // Check if uId is already an owner of the channel
    if (channelToAdd.ownerIds.includes(uId) === true) {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdAlreadyOwner);
    } else {
      // add uId to the array of channel owners
      channelToAdd = dataStore.channels.find(channel => channel.channelId === channelId);
      channelToAdd.ownerIds.push(uId);
      // add channelId to users channel owner array
      userToAdd.ownedChannelIds.push(channelId);
      setData(dataStore);
      return {};
    }
  } else {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
}

/**
 * A function that a allows owners to remove the owner permissions of other owners
 * @param {string} token - token to validate the user who requests to remove an owner
 * @param {number} channelId - id for the channel of interest
 * @param {number} uId - the member of the channel to no longer be an owner
 * @returns {{}} - if the member is successfully revoked of their owner permissions
 * @returns {{ StatusCode STATUS.BAD_REQUEST }} - when channelId invalid
 *                               - when uId is invalid
 *                               - when uId is not a member of the channel
 *                               - uId already doesn't have owner permissions
 * @returns {{ StatusCode STATUS.FORBIDDEN }} - when token is invalid
 *                               - when authUser is not a member of the channel
 *                               - when authUser doesn't have owner permissions
 */
function channelRemoveOwnerV2(token: string, channelId: number, uId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if channelId is valid
  let channelToRemove = channelProfile(channelId);
  if ('error' in channelToRemove) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }
  // check uId is valid
  userProfileV3(token, uId);
  // check if userId is a member of the channel
  if (channelToRemove.memberIds.includes(uId) === false) { throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember); }

  // check if authUserId is part of the channel
  if (channelToRemove.memberIds.includes(authUserId) === false) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }
  // Check if the authUser has owner permissions
  const authUser = dataStore.users.find(user => user.uId === authUserId);
  if (channelToRemove.ownerIds.includes(authUserId) || authUser.globalOwner === true) {
    // Check if uId is an owner of the channel
    if (channelToRemove.ownerIds.includes(uId)) {
      // Check if uId is the only owner of the channel
      if (channelToRemove.ownerIds.length === 1) {
        throw HTTPError(STATUS.BAD_REQUEST, errorString.lastOwner);
      }
      //  remove uId from the array of channel owners
      channelToRemove = dataStore.channels.find(channel => channel.channelId === channelId);
      let index = channelToRemove.ownerIds.indexOf(uId);
      channelToRemove.ownerIds.splice(index, 1);

      // remove channelId from users channel owners array
      const userToRemove = dataStore.users.find(user => user.uId === uId);
      index = userToRemove.ownedChannelIds.indexOf(channelId);
      userToRemove.ownedChannelIds.splice(index, 1);

      setData(dataStore);
      return {};
    } else {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.notAnOwner);
    }
  } else {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
}

export {
  channelLeaveV2,
  channelRemoveOwnerV2,
  channelAddOwnerV2
};
