import fs from 'fs';

// --------------------------------//
// -----------Interfaces-----------//
export interface ChannelsStats {
  numChannelsJoined: number,
  timeStamp: number,
}

export interface DmsStats {
  numDmsJoined: number,
  timeStamp: number
}

export interface MessagesStats {
  numMessagesSent: number,
  timeStamp: number,
}
interface userStats {
  channelsJoined: ChannelsStats [],
  dmsJoined: DmsStats [],
  messagesSent: MessagesStats [],
}

export interface Notification {
  channelId: number,
  dmId: number,
  notificationMessage: string
}

export interface UserObject {
  uId: number,
  email: string
  permissionId: number
  nameFirst: string,
  nameLast: string,
  handleStr: string,
  handleStrDisplay: string
  handleInt: number,
  password: string,
  channelIds: Array<number>,
  ownedChannelIds: Array<number>,
  dmIds: Array<number>,
  ownedDmIds: Array<number>,
  activeTokens: Array<string>
  globalOwner: boolean,
  userStats: userStats
  resetToken: string,
  resetCounter: number,
  notifications: Array<Notification>,
  isActive: boolean,
  profilePhoto: string
}

export interface React {
  reactId: number,
  uIds: number [],
  isThisUserReacted?: boolean
}
export interface Message {
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
  reacts: React[],
  isPinned: boolean,
}

export interface StandupMessage {
  uId: number
  message: string,
}

export interface Standup {
  isStandupActive: boolean,
  timeFinish: number | null,
  uIdStart: number | null,
  standupMessages: StandupMessage[],
}

export interface ChannelObject {
  channelId: number,
  channelName: string,
  memberIds: number[],
  isPublic: boolean,
  ownerIds: number[],
  messages: Message[],
  standup: Standup,
}

export interface DmObject {
  dmId: number,
  dmName: string,
  memberUid: number[],
  creatorUid: number,
  messages: Message[]
}

export interface ChannelsExist {
  numChannelsExist: number,
  timeStamp: number,
}

export interface DmsExist {
  numDmsExist: number,
  timeStamp: number,
}

export interface MessagesExist {
  numMessagesExist: number,
  timeStamp: number,
}
export interface WorkspaceStats {
  channelsExist: ChannelsExist[],
  dmsExist: DmsExist [],
  messagesExist: MessagesExist[],
}

export interface DataStoreType {
  channels: ChannelObject[],
  users: UserObject[],
  dms: DmObject[],
  messageCount: number,
  dmCount: number,
  messages: number,
  emails: Array<string>,
  workSpaceStats: WorkspaceStats,
  imageId: number
}

// Object of shape {
// channelsExist: [{numChannelsExist, timeStamp}],
// dmsExist: [{numDmsExist, timeStamp}],
// messagesExist: [{numMessagesExist, timeStamp}],
// utilizationRate
//   }
// --------------------------------//
// -----------Datastore------------//

let data: DataStoreType = {
  channels: [],
  users: [],
  dms: [],
  messageCount: 0,
  dmCount: 1,
  messages: 0,
  emails: [],
  imageId: 0,
  workSpaceStats: {
    channelsExist: [{ numChannelsExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
    dmsExist: [{ numDmsExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
    messagesExist: [{ numMessagesExist: 0, timeStamp: Math.floor((new Date()).getTime() / 1000) }],
  }
};

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data
function getData() {
  load();
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData : DataStoreType) {
  data = newData;
  save();
}

// Use save() to save data to database file
function save() {
  fs.writeFileSync('./database.json', JSON.stringify(data));
}

// Use load() to load data from database file
function load() {
  if (fs.existsSync('./dataBase.json')) {
    const dataLoad = fs.readFileSync('./database.json');
    data = JSON.parse(String(dataLoad));
  }
}

export { getData, setData, save, load };
