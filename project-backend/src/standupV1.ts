import { checkToken } from './authV3';
import { ChannelObject, getData, Message, setData } from './dataStore';
import { messageIdGen, updateStatsMessages } from './messagesV2';
import { getTime } from './other';

import HTTPError from 'http-errors';
import { errorString } from './errors';
import { STATUS, LENGTH, TYPE, INVALID } from './magic_nums';

interface StandupStartV1Return {
  timeFinish: number
}

interface StandupActiveV1Return {
  isActive: boolean
  timeFinish: number | null
}

/**
 * <Function which starts (and completes) a stand up in a given channel>
 *
 * @param {string} token - user token
 * @param {number} channelId - channelId of standup
 * @param {number} length - length of standup
 * @returns {{ timefinish }} - time when standup finishes
 * @throws - 400 - when channelId is invalid
 *         - 400 - when length is invalid
 *         - 400 - when standup is already active
 *         - 403 - when channelId valid but user not member of channel
 *         - 403 - when token is invalid
 */
export function standupStartV1(token: string, channelId: number, length: number): StandupStartV1Return {
  const data = getData();
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }
  const channel = data.channels.find((channel) => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid);
  }

  if (length < LENGTH.STANDUP) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidStandUpLength); }

  if (channel.memberIds.find((memberId) => memberId === tokenId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }

  if (standupActiveV1(token, channel.channelId).isActive === true) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.standupAlreadyActive);
  }

  const timeFinish = getTime() + length;
  channel.standup.isStandupActive = true;
  channel.standup.timeFinish = timeFinish;
  channel.standup.uIdStart = tokenId;
  setTimeout(standupEnd, length * 1000, tokenId, channel);

  setData(data);

  return { timeFinish: timeFinish };
}

/**
 * <Function which checks if standup is currently active>
 *
 * @param {string} token - user token
 * @param {number} channelId - channelId of standup
 * @returns {{ isActive, timeFinish }} - time when standup finishes and if standup is active
 * @throws - STATUS.BAD_REQUEST - when channelId is invalid
 *         - STATUS.FORBIDDEN - when channelId valid but user not member of channel
 *         - STATUS.FORBIDDEN - when token is invalid
 */
export function standupActiveV1(token: string, channelId: number): StandupActiveV1Return {
  const data = getData();
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }

  const channel = data.channels.find((channel) => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid);
  }

  if (channel.memberIds.find(memberId => memberId === tokenId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }

  let timeFinish = null;
  if (channel.standup.isStandupActive === true) {
    timeFinish = channel.standup.timeFinish;
  }

  const standupActiveObject = {
    isActive: channel.standup.isStandupActive,
    timeFinish: timeFinish
  };
  return standupActiveObject;
}

/**
 * <Function which sends a message to a buffer for a stand up in a given channel>
 *
 * @param {string} token - user token
 * @param {number} channelId - channelId of standup
 * @param {string} message - message to send
 * @throws - STATUS.BAD_REQUEST - when channelId is invalid
 *         - STATUS.BAD_REQUEST - when length is not between 0<1000
 *         - STATUS.BAD_REQUEST - when standup is already active
 *         - STATUS.FORBIDDEN - when channelId valid but user not member of channel
 *         - STATUS.FORBIDDEN - when token is invalid
 */
export function standupSendV1(token: string, channelId: number, message: string) {
  const data = getData();
  const tokenId = checkToken(token);
  if (tokenId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }

  const channel = data.channels.find((channel) => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid);
  }

  if (message.length > LENGTH.MAX_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }

  if (channel.memberIds.find((memberId) => memberId === tokenId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }

  if (standupActiveV1(token, channel.channelId).isActive === false) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.standupNotActive);
  }

  const standupMessageObject = {
    uId: tokenId,
    message: message,
  };
  channel.standup.standupMessages.push(standupMessageObject);

  setData(data);

  return {};
}

// Executes code to end and send the buffered standup message
function standupEnd(uId: number, channel: ChannelObject) {
  let data = getData();
  channel.standup.isStandupActive = false;
  channel.standup.timeFinish = null;
  channel.standup.uIdStart = null;
  let standupMessage = '';
  for (const message of channel.standup.standupMessages) {
    const userHandle = data.users.find((user) => user.uId === message.uId).handleStrDisplay;
    standupMessage += (userHandle + ':' + ' ' + message.message + '\n');
  }
  channel.standup.standupMessages = [];
  if (standupMessage.length !== 0) {
    const messageId = messageIdGen(TYPE.CHANNEL, channel.channelId);
    const messageObject: Message = {
      messageId: messageId,
      uId: uId,
      message: standupMessage.trimEnd(),
      timeSent: getTime(),
      reacts: [
        {
          reactId: 1,
          uIds: [],
        }
      ],
      isPinned: false,
    };
    channel.messages.unshift(messageObject);
    data.messageCount++;
    data = updateStatsMessages(data, uId);
    setData(data);
  }
}
