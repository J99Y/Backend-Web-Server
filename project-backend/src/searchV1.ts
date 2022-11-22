import { getData, Message, UserObject, DataStoreType } from './dataStore';
import { errorString } from './errors';
import { checkToken } from './authV3';
import HTTPError from 'http-errors';
import { INVALID, LENGTH, STATUS } from './magic_nums';

function searchInChannel(dataStore: DataStoreType, user: UserObject, channelId: number, queryStr: string, messages: Message[]) {
  const channelObject = dataStore.channels.find(channel => channel.channelId === channelId);
  for (const message of channelObject.messages) {
    const compareStr = message.message.toLowerCase();
    if (compareStr.includes(queryStr)) {
      messages.push(message);
    }
  }
  return messages;
}

function searchInDm(dataStore: DataStoreType, user: UserObject, dmId: number, queryStr: string, messages: Message[]) {
  const dmObject = dataStore.dms.find(dm => dm.dmId === dmId);
  for (const message of dmObject.messages) {
    const compareStr = message.message.toLowerCase();
    if (compareStr.includes(queryStr)) {
      messages.push(message);
    }
  }
  return messages;
}

export function searchV1(token: string, queryStr: string) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  // check queryStr is valid
  if (queryStr.length > LENGTH.MAX_MESSAGE || queryStr.length < LENGTH.MIN_MESSAGE) {
    throw HTTPError(STATUS.BAD_REQUEST, errorString.messageLength);
  }
  let messages: Message[] = [];
  const user = dataStore.users.find(user => user.uId === authUserId);
  // Loop through users channels and users dms
  for (const channelId of user.channelIds) {
    messages = searchInChannel(dataStore, user, channelId, queryStr, messages);
  }
  for (const dmId of user.dmIds) {
    messages = searchInDm(dataStore, user, dmId, queryStr, messages);
  }
  return { messages: messages };
}
