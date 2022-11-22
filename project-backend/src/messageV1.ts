import { checkToken } from './authV3';
import { addDmTagMessageNotification, addChannelTagMessageNotification } from './notificationsV1';
// import { getTime } from './other';

import { DataStoreType, getData, setData, Message, UserObject, Notification } from './dataStore';
import { messageIdGen, messageIdDecode, updateStatsMessages } from './messagesV2';
import HTTPError from 'http-errors';
import { errorString } from './errors';
import { getTime } from './other';
import { INVALID, LENGTH, STATUS, TYPE } from './magic_nums';

interface DecodedMessageId {
  messageType: number,
  id: number,
  messageId: number,
}

function getHandleStr(uId: number) {
  const dataStore = getData();
  for (const user of dataStore.users) {
    if (user.uId === uId) {
      return user.handleStrDisplay;
    }
  }
}

function getMessageObject(messageId: number): Message {
  const dataStore = getData();
  let message: Message;
  // Search in the channels for the message
  for (const channelsIndex in dataStore.channels) {
    message = dataStore.channels[channelsIndex].messages.find(messageObject => messageObject.messageId === messageId);
    if (message !== undefined) {
      return message;
    }
  }
  // Message belongs in a dm, not a channel
  for (const dmsIndex in dataStore.dms) {
    message = dataStore.dms[dmsIndex].messages.find(messageObject => messageObject.messageId === messageId);
    if (message !== undefined) {
      return message;
    }
  }
}

function getMessageChannel(messageId: number) {
  const dataStore = getData();
  for (const channel of dataStore.channels) {
    if (channel.messages.find(messageObject => messageObject.messageId === messageId) !== undefined) {
      return channel;
    }
  }
}

function getMessageDm(messageId: number) {
  const dataStore = getData();
  for (const dm of dataStore.dms) {
    if (dm.messages.find(messageObject => messageObject.messageId === messageId) !== undefined) {
      return dm;
    }
  }
}

function getMessageChannelIndex(messageId: number) {
  const dataStore = getData();
  for (const channel in dataStore.channels) {
    const messageObject = dataStore.channels[channel].messages.find(messageObject => messageObject.messageId === messageId);
    if (messageObject !== undefined) {
      return dataStore.channels[channel].messages.indexOf(messageObject);
    }
  }
}

function getMessageDmIndex(messageId: number) {
  const dataStore = getData();
  for (const dm in dataStore.dms) {
    const dmObject = dataStore.dms[dm].messages.find(messageObject => messageObject.messageId === messageId);
    if (dmObject !== undefined) {
      return dataStore.dms[dm].messages.indexOf(dmObject);
    }
  }
}

export function messageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  let dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // Check whether there is a sharelocation specified
  if (dmId === INVALID && channelId === INVALID) { throw HTTPError(STATUS.BAD_REQUEST, errorString.shareLocationUnspecified); }
  // Check whether there is only one sharelocation specifed
  if (dmId !== INVALID && channelId !== INVALID) { throw HTTPError(STATUS.BAD_REQUEST, errorString.shareLocationUnspecified); }
  // Check if the ogMessageId is valid
  const decodedMessageId = messageIdDecode(ogMessageId);
  if (decodedMessageId === INVALID) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId); }
  // Check message length
  if (message.length > LENGTH.MAX_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }
  // Check if the user belongs to the channel / dm with the ogMessage
  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    const messageChannel = getMessageChannel(ogMessageId);
    if (!(messageChannel.memberIds.includes(authUserId))) {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember);
    }
  } else {
    const messageDm = getMessageDm(ogMessageId);
    if (!(messageDm.memberUid.includes(authUserId))) {
      throw HTTPError(STATUS.BAD_REQUEST, errorString.dmNotMember);
    }
  }
  // If channelId is not -1, then check it is valid
  if (channelId !== INVALID) {
    const channelObject = dataStore.channels.find(a => a.channelId === channelId);
    if (channelObject === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid); }
    // check if userId is a member of the channel
    if (channelObject.memberIds.includes(authUserId) === false) { throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember); }

    // share the message
    const ogMessageObject = getMessageObject(ogMessageId);
    const newMessageId = messageIdGen(TYPE.CHANNEL, channelId);
    const messageObject: Message = {
      messageId: newMessageId,
      uId: authUserId,
      message: message + `\n--------\n${ogMessageObject.message}\n--------`,
      timeSent: getTime(),
      reacts: [
        {
          reactId: 1,
          uIds: [],
        }
      ],
      isPinned: false,
    };
    channelObject.messages.unshift(messageObject);
    dataStore = updateStatsMessages(dataStore, authUserId);
    // Add a notification if the share message contains a tag
    addChannelTagMessageNotification(dataStore, channelId, message, authUserId);
    setData(dataStore);

    return { shareMessageId: newMessageId };
  }

  // If dmId is not -1, check if it is valid
  if (dmId !== INVALID) {
    const dm = dataStore.dms.find(a => a.dmId === dmId);
    if (dm === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId); }
    // Check if the authUser is part of the dm
    const isMember = dm.memberUid.find(uId => uId === authUserId);
    if (isMember === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }

    // share the message
    const ogMessageObject = getMessageObject(ogMessageId);
    const newMessageId = messageIdGen(TYPE.DM, dmId);
    const messageObject: Message = {
      messageId: newMessageId,
      uId: authUserId,
      message: message + `\n--------\n${ogMessageObject.message}\n--------`,
      timeSent: getTime(),
      reacts: [
        {
          reactId: 1,
          uIds: [],
        }
      ],
      isPinned: false,
    };
    dm.messages.unshift(messageObject);
    dataStore = updateStatsMessages(dataStore, authUserId);
    // Add a notification if the share message has a tag
    addDmTagMessageNotification(dataStore, dmId, message, authUserId);
    setData(dataStore);

    return { shareMessageId: newMessageId };
  }
}

function pinMessageDm(dataStore: DataStoreType, decodedMessageId: DecodedMessageId, authUser: UserObject) {
  const dmIndex = dataStore.dms.findIndex(dm => dm.dmId === decodedMessageId.id);
  if (dataStore.dms[dmIndex].memberUid.find(members => members === authUser.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember);
  }
  if (dataStore.dms[dmIndex].creatorUid !== authUser.uId && authUser.globalOwner === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
  // Pin the message
  const messageIndex = getMessageDmIndex(decodedMessageId.messageId);
  dataStore.dms[dmIndex].messages[messageIndex].isPinned = true;
  setData(dataStore);
}
function pinMessageChannel(dataStore: DataStoreType, decodedMessageId: DecodedMessageId, authUser: UserObject) {
  const channelIndex = dataStore.channels.findIndex(channel => channel.channelId === decodedMessageId.id);
  if (dataStore.channels[channelIndex].memberIds.find(members => members === authUser.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember);
  }
  if (dataStore.channels[channelIndex].ownerIds.find(members => members === authUser.uId) === undefined && authUser.globalOwner === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
  const messageIndex = getMessageChannelIndex(decodedMessageId.messageId);
  dataStore.channels[channelIndex].messages[messageIndex].isPinned = true;
  setData(dataStore);
}

function unpinMessageDm(dataStore: DataStoreType, decodedMessageId: DecodedMessageId, authUser: UserObject) {
  const dmIndex = dataStore.dms.findIndex(dm => dm.dmId === decodedMessageId.id);
  if (dataStore.dms[dmIndex].memberUid.find(members => members === authUser.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember);
  }
  if (dataStore.dms[dmIndex].creatorUid !== authUser.uId && authUser.globalOwner === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
  const messageIndex = getMessageDmIndex(decodedMessageId.messageId);
  dataStore.dms[dmIndex].messages[messageIndex].isPinned = false;
  setData(dataStore);
}
function unpinMessageChannel(dataStore: DataStoreType, decodedMessageId: DecodedMessageId, authUser: UserObject) {
  const channelIndex = dataStore.channels.findIndex(channel => channel.channelId === decodedMessageId.id);
  if (dataStore.channels[channelIndex].memberIds.find(members => members === authUser.uId) === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.uIdNotMember);
  }
  if (dataStore.channels[channelIndex].ownerIds.find(members => members === authUser.uId) === undefined && authUser.globalOwner === false) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.noOwnerPermissions);
  }
  const messageIndex = getMessageChannelIndex(decodedMessageId.messageId);
  dataStore.channels[channelIndex].messages[messageIndex].isPinned = false;
  setData(dataStore);
}

export function messagePinV1(token: string, messageId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // Check if the messageId is valid
  const decodedMessageId = messageIdDecode(messageId);
  if (decodedMessageId === INVALID) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  // Check is message is already pinned
  const messageObject = getMessageObject(messageId);
  if (messageObject.isPinned === true) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.alreadyPinned);
  }
  const authUser = dataStore.users.find(user => user.uId === authUserId);
  // Determine if the message location is a channel or dm
  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    pinMessageChannel(dataStore, decodedMessageId, authUser);
  } else {
    pinMessageDm(dataStore, decodedMessageId, authUser);
  }
  return {};
}

export function messageUnpinV1(token: string, messageId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  // Check if the messageId is valid
  const decodedMessageId = messageIdDecode(messageId);
  if (decodedMessageId === INVALID) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  // Check is message is already unpinned
  const messageObject = getMessageObject(messageId);
  if (messageObject.isPinned === false) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.notPinned);
  }
  // Check if the authUser has owner permissions
  // Check is authUser is the global owner
  const authUser = dataStore.users.find(user => user.uId === authUserId);
  // Determine if the message location is a channel or dm
  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    unpinMessageChannel(dataStore, decodedMessageId, authUser);
  } else {
    unpinMessageDm(dataStore, decodedMessageId, authUser);
  }
  return {};
}

/**
 * Add uIds to reaction
 * @param token
 * @param messageId
 * @param reactId
 * @returns
 */
export function messageReactV1(token: string, messageId: number, reactId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // Check if the messageId is valid
  const decodedMessageId = messageIdDecode(messageId);
  if (decodedMessageId === INVALID) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }

  let message: Message;
  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    const channelIndex = dataStore.channels.findIndex(index => index.channelId === decodedMessageId.id);
    message = dataStore.channels[channelIndex].messages.find(a => a.messageId === messageId);
    if (message === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId); }
  } else if (decodedMessageId.messageType === TYPE.DM) {
    const dmIndex = dataStore.dms.findIndex(index => index.dmId === decodedMessageId.id);
    message = dataStore.dms[dmIndex].messages.find(a => a.messageId === messageId);
    if (message === undefined) { throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId); }
  }

  // only 1 react Id in datastore
  if (reactId !== 1) { throw HTTPError(STATUS.BAD_REQUEST, errorString.reactIdInvalid); }

  const reactIndex = message.reacts.findIndex(a => a.reactId === reactId);
  if (message.reacts[reactIndex].uIds.includes(authUserId)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.reactedAlready); }

  message.reacts[reactIndex].uIds.push(authUserId);

  if (decodedMessageId.messageType === TYPE.CHANNEL) {
    const messageObject = getMessageObject(messageId);
    const userToAddNotification = dataStore.users.find(user => user.uId === messageObject.uId);
    if (getMessageChannel(messageId).memberIds.find(uId => uId === userToAddNotification.uId) !== undefined) {
      // Add react to the user's notification
      const newNotification: Notification = {
        channelId: getMessageChannel(messageId).channelId,
        dmId: INVALID,
        notificationMessage: `${getHandleStr(authUserId)} reacted to your message in ${getMessageChannel(messageId).channelName}`,
      };
      userToAddNotification.notifications.unshift(newNotification);
    }
  } else if (decodedMessageId.messageType === TYPE.DM) {
    const messageObject = getMessageObject(messageId);
    const userToAddNotification = dataStore.users.find(user => user.uId === messageObject.uId);
    // Add react to the user's notifications
    if (getMessageDm(messageId).memberUid.find(uId => uId === userToAddNotification.uId) !== undefined) {
      const newNotification: Notification = {
        channelId: INVALID,
        dmId: getMessageDm(messageId).dmId,
        notificationMessage: `${getHandleStr(authUserId)} reacted to your message in ${getMessageDm(messageId).dmName}`,
      };
      userToAddNotification.notifications.unshift(newNotification);
    }
  }
  setData(dataStore);
  return {};
}

/**
 * delete uIds to reaction
 * @param token
 * @param messageId
 * @param reactId
 * @returns
 */
export function messageUnReactV1(token: string, messageId: number, reactId: number) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // Check if the messageId is valid
  const decodedMessageId = messageIdDecode(messageId);
  if (decodedMessageId === INVALID) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidMessageId);
  }
  // only 1 react Id in datastore
  if (reactId !== 1) { throw HTTPError(STATUS.BAD_REQUEST, errorString.reactIdInvalid); }

  // these 2 for loops will find the message object
  let message;
  for (const channel in dataStore.channels) {
    message = dataStore.channels[channel].messages.find(a => a.messageId === messageId);
    if (message !== undefined) { break; }
  }

  if (message === undefined) {
    for (const dm in dataStore.dms) {
      message = dataStore.dms[dm].messages.find(a => a.messageId === messageId);
      if (message !== undefined) { break; }
    }
  }
  const reactIndex = 0;
  // check if message contian a react from the authUser
  if (!message.reacts[reactIndex].uIds.includes(authUserId)) { throw HTTPError(STATUS.BAD_REQUEST, errorString.notReacted); }

  // find the uIds of the authorised user inside the uIds
  const index = message.reacts[reactIndex].uIds.indexOf(authUserId);
  message.reacts[reactIndex].uIds.splice(index, 1);

  setData(dataStore);
  return {};
}

export function messageSendLaterV1(token: string, channelId: number, message: string, timeSent: number) {
  const dataStore = getData();
  // check valid token
  const authUserId = checkToken(token);
  if (authUserId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }
  // check valid channelId
  const channel = dataStore.channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.chanIdNotValid);
  }
  // check valid message lengths
  if (message.length > LENGTH.MAX_MESSAGE || message.length < LENGTH.MIN_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }
  // check if timeSent is not in the past
  const timeDelay = timeSent - getTime();
  if (timeDelay < 0) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.timeSentPast);
  }
  // check user is member of channel
  if (channel.memberIds.find(memberId => memberId === authUserId) === undefined) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.uIdNotMember);
  }

  // create an Message Id before entering the timeout
  // this function will save the message Id and ensure it wont be reused
  const messageId = messageIdGen(TYPE.CHANNEL, channelId);

  // The timeout, given an integer it will delay making a new message
  // by timeSent seconds
  setTimeout(() => {
    let data = getData();
    const messageObject: Message = {
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
    };

    // finds the channel in which new message will be sent and places at index 0
    const newMessage = data.channels.find(a => a.channelId === channelId);
    newMessage.messages.unshift(messageObject);
    // addChannelTagNotification(dataStore, messageObject.messageId);
    // these lines keep track of the stats of dataStore
    data = updateStatsMessages(data, authUserId);
    // addChannelTagNotification(dataStore, messageId);
    addChannelTagMessageNotification(data, channelId, message, authUserId);
    console.log(data.users.find(a => a.uId === authUserId));

    setData(data);
  }, timeDelay * 1000);
  return { messageId: messageId };
}

/**
 * <Send message to a dm at later time>
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
export function messageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number) {
  // check token is valid
  const dataStore = getData();
  const user = checkToken(token);
  if (user === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }

  // check if message is of valid length
  if (message.length < LENGTH.MIN_MESSAGE || message.length > LENGTH.MAX_MESSAGE) { throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength); }
  const dm = dataStore.dms.find(a => a.dmId === dmId);
  if (dm === undefined) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.invalidDmId);
  }

  // check if timeSent is not in the past
  const timeDelay = timeSent - getTime();
  if (timeDelay < 0) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.timeSentPast);
  }

  // checks if userId associated with token part of dm
  const result = dm.memberUid.find(a => a === user);
  if (result === undefined) { throw HTTPError(STATUS.FORBIDDEN, errorString.dmNotMember); }

  // create an Message Id before entering the timeout
  // this function will save the message Id and ensure it wont be reused
  const messageId = messageIdGen(TYPE.DM, dmId);

  // The timeout, given an integer it will delay making a new message
  // by timeSent seconds
  setTimeout(() => {
    let data = getData();

    // find the dm which the message will be added to
    const newMessage = data.dms.find(a => a.dmId === dmId);
    const messageObject: Message = {
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
    };
    // places message at front of messages
    newMessage.messages.unshift(messageObject);
    // addDmTagNotification(dataStore, messageObject.messageId);
    // updates the stats of user and workSpace
    data = updateStatsMessages(data, user);
    // addDmTagNotification(dataStore, messageId);
    addDmTagMessageNotification(data, dmId, message, user);
    setData(data);
  }, timeDelay * 1000);
  return { messageId: messageId };
}
