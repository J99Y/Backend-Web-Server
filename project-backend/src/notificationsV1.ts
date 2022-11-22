import { getData, setData, Notification, DataStoreType } from './dataStore';
import { errorString } from './errors';
import { checkToken } from './authV3';
import HTTPError from 'http-errors';
import { STATUS, INVALID } from './magic_nums';

function validateHandleStr(handleStr: string) {
  const dataStore = getData();
  for (const user of dataStore.users) {
    if (user.handleStrDisplay === handleStr) {
      return true;
    }
  }
  return false;
}

function getHandleStr(uId: number) {
  const dataStore = getData();
  for (const user of dataStore.users) {
    if (user.uId === uId) {
      return user.handleStrDisplay;
    }
  }
}

export function addChannelTagMessageNotification(dataStore: DataStoreType, channelId: number, message: string, authUserId: number) {
  const channelObject = dataStore.channels.find(channel => channel.channelId === channelId);
  const regex = /@[A-Za-z0-9]*/g;
  // Get unique handleStrings from tags
  let tags = message.match(regex);
  if (tags === null) {
    return;
  }
  tags = tags.filter((t, index) => {
    return tags.indexOf(t) === index;
  });
  for (const tag in tags) {
    tags[tag] = tags[tag].replace('@', '');
  }
  for (const tag of tags) {
    // Check if tag is a valid handle str
    if (validateHandleStr(tag)) {
      const userObject = dataStore.users.find(user => user.handleStrDisplay === tag);
      if (channelObject.memberIds.find(uId => uId === userObject.uId) !== undefined) {
        // Add notification to the user
        const newNotification: Notification = {
          channelId: channelObject.channelId,
          dmId: INVALID,
          notificationMessage: `${getHandleStr(authUserId)} tagged you in ${channelObject.channelName}: ${message.slice(0, 20)}`,
        };
        dataStore.users.find(user => user.handleStrDisplay === tag).notifications.unshift(newNotification);
      }
    }
  }
  setData(dataStore);
}

export function addDmTagMessageNotification(dataStore: DataStoreType, dmId: number, message: string, authUserId: number) {
  const dmObject = dataStore.dms.find(dm => dm.dmId === dmId);
  const regex = /@[A-Za-z0-9]*/g;
  // Get unique handleStrings from tags
  let tags = message.match(regex);
  if (tags === null) {
    return;
  }
  tags = tags.filter((t, index) => {
    return tags.indexOf(t) === index;
  });
  for (const tag in tags) {
    tags[tag] = tags[tag].replace('@', '');
  }
  for (const tag of tags) {
    // Check if tag is a valid handle str
    if (validateHandleStr(tag)) {
      const userObject = dataStore.users.find(user => user.handleStrDisplay === tag);
      console.log('+++++++Tag is valid');
      if (dmObject.memberUid.find(uId => uId === userObject.uId) !== undefined) {
        console.log('==========Tag belongs to the dm');
        // Add notification to the user
        const newNotification: Notification = {
          channelId: INVALID,
          dmId: dmObject.dmId,
          notificationMessage: `${getHandleStr(authUserId)} tagged you in ${dmObject.dmName}: ${message.slice(0, 20)}`,
        };
        dataStore.users.find(user => user.handleStrDisplay === tag).notifications.unshift(newNotification);
      }
    }
  }
  setData(dataStore);
}

export function notificationsV1(token: string) {
  const dataStore = getData();
  // check token is valid
  const authUserId = checkToken(token);
  if (authUserId === INVALID) { throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken); }
  const user = dataStore.users.find(user => user.uId === authUserId);
  const notifications: Notification[] = [];
  let i = 0;
  while (i < 20 && i < user.notifications.length) {
    notifications.push(user.notifications[i]);
    i++;
  }
  return { notifications: notifications };
}
