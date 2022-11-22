import { errorString } from './errors';
import { ChannelsExist, DataStoreType, DmsExist, MessagesExist } from './dataStore';
import HTTPError from 'http-errors';
import { checkToken } from './authV3';
import { getData } from './dataStore';
import { INVALID, STATUS } from './magic_nums';

interface returnWorkSpaceStat {
  workspaceStats: {
    channelsExist: ChannelsExist[],
    dmsExist: DmsExist [],
    messagesExist: MessagesExist[],
    utilizationRate: number,
  }
}

export function usersStats(token: string): returnWorkSpaceStat {
  const authUserId = checkToken(token);
  if (authUserId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }
  const dataStore = getData();
  const stat = dataStore.workSpaceStats;
  const rate = utilizationRate();
  return {
    workspaceStats: {
      channelsExist: stat.channelsExist,
      dmsExist: stat.dmsExist,
      messagesExist: stat.messagesExist,
      utilizationRate: rate,
    }
  };
}

function utilizationRate(): number {
  const dataStore = getData();
  const numUsers = dataStore.users.length;
  const activeUsers = activeUser(dataStore);
  if (activeUsers === 0) { return 0; }

  return activeUsers / numUsers;
}

function activeUser(datastore: DataStoreType) {
  let count = 0;
  for (const user of datastore.users) {
    if (user.dmIds.length > 0 || user.channelIds.length > 0) {
      count++;
    }
  }

  return count;
}
