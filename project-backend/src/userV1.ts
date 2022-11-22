import { errorString } from './errors';
import {
  ChannelsStats,
  DmsStats,
  MessagesStats,
  setData,
} from './dataStore';
import HTTPError from 'http-errors';
import { checkToken } from './authV3';
import { getData, UserObject } from './dataStore';
import { INVALID, LENGTH, STATUS } from './magic_nums';

interface returnUserStat {
  userStats: {
    channelsJoined: ChannelsStats [],
    dmsJoined: DmsStats [],
    messagesSent: MessagesStats [],
    involvementRate: number,
  }
}

const fs = require('fs');
const axios = require('axios');

const downloadImage = (url: string, imagePath: string) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    (response: { data: { pipe: (arg0: any) => { (): any; new(): any; on: { (arg0: string, arg1: () => void): { (): any; new(): any; on: { (arg0: string, arg1: (e: any) => void): void; new(): any; }; }; new(): any; }; }; }; }) =>
      new Promise<void>((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(imagePath))
          .on('finish', () => resolve());
      })
  );

export async function uploadphoto(imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number, authToken: string) {
  if (xEnd <= xStart || yEnd <= yStart) { throw (HTTPError(400, errorString.invalidPhoto)); }
  if (!imgUrl.endsWith('.jpg')) { throw (HTTPError(400, errorString.invalidPhoto)); }

  const dataStore = getData();
  const Jimp = require('jimp');

  try {
    downloadImage(imgUrl, './public/profilePhotos/temp.jpg');
    const image = await Jimp.read('./public/profilePhotos/temp.jpg');

    if (xEnd > image.getWidth() || yEnd > image.getHeight()) { throw HTTPError(400, errorString.invalidPhoto); }
    if (xStart < 0 || yStart < 0) { throw HTTPError(400, errorString.invalidPhoto); }

    image.crop(xStart, yStart, (xEnd - xStart), (yEnd - yStart));
    const imagePath = './public/profilePhotos/' + dataStore.imageId.toString() + '.jpg';
    image.write(imagePath);

    const authUserId = checkToken(authToken);
    if (authUserId === -1) {
      throw HTTPError(403, errorString.invalidToken);
    }

    const userIndex = dataStore.users.findIndex(user => user.uId === authUserId);
    dataStore.users[userIndex].profilePhoto = 'http://localhost:8082/profilePhotos/' + dataStore.imageId.toString() + '.jpg';

    dataStore.imageId = dataStore.imageId + 1;

    setData(dataStore);

    return {};
  } catch {
    throw HTTPError(400, errorString.invalidPhoto);
  }
}

export function userStats(token: string): returnUserStat {
  const authUserId = checkToken(token);
  if (authUserId === INVALID) {
    throw HTTPError(STATUS.FORBIDDEN, errorString.invalidToken);
  }
  const dataStore = getData();
  const user = dataStore.users.find(a => a.uId === authUserId);
  const stat = user.userStats;
  const rate = involvementRate(user);
  return {
    userStats: {
      channelsJoined: stat.channelsJoined,
      dmsJoined: stat.dmsJoined,
      messagesSent: stat.messagesSent,
      involvementRate: rate,
    }
  };
}

function involvementRate(user: UserObject): number {
  const dataStore = getData();
  const sumUser = user.channelIds.length + user.dmIds.length + (user.userStats.messagesSent.length - 1);
  const sumDatastore = dataStore.channels.length + dataStore.dms.length + (dataStore.messages);
  if (sumDatastore === 0) { return LENGTH.MIN_RATE; }
  let rate = sumUser / sumDatastore;

  if (rate >= LENGTH.MAX_RATE) {
    rate = LENGTH.MAX_RATE;
  }
  return rate;
}
