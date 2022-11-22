import { setData } from './dataStore';
import { DataStoreType } from './dataStore';

/**
 * <Resets the database to inital state>
 *
 */
export function clearV1() {
  const initDataState : DataStoreType = {
    channels: [],
    users: [],
    dms: [],
    messageCount: 0,
    dmCount: 1,
    messages: 0,
    emails: [],
    workSpaceStats: {
      channelsExist: [{ numChannelsExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
      dmsExist: [{ numDmsExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
      messagesExist: [{ numMessagesExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
    },
    imageId: 0
  };

  setData(initDataState);

  return {};
}
/**
 * <Function which gets current time>
 *
 * @returns { number } time (unix timeStamp in seconds) when request was made
 */
export function getTime() {
  const time = Math.floor(Date.now() / 1000);
  return time;
}
