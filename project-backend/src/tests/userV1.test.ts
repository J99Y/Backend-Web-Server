import {
  requestUserStats,
  requestRegisterV3,
  requestClearV1,
  requestChannelsCreateV3,
  requestDmCreateV2,
  requestSendDm,
  requestMessageSendV2,
  requestChannelJoinV3,
  requestChannelLeaveV2,
  requestDmRemoveV2,
  requestDmLeaveV2,
  requestPhotoUpload,
} from './testRequestRoutes';

describe('user/stats/v1', () => {
  test('Invalid Token', () => {
    const result = requestUserStats('notvalidtoken');
    expect(result).toEqual(403);
  });

  test('Success - initial creation', () => {
    const user = requestRegisterV3('test@gmail.com', 'Northman', 'test', 'user');
    const result = requestUserStats(user.token);
    expect(result).toStrictEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }],
        involvementRate: expect.any(Number),
      }
    });
  });
  requestClearV1();

  test('Success - joined channels', () => {
    const user = requestRegisterV3('testEmail@gmail.com', 'Northman', 'test', 'user');
    const user2 = requestRegisterV3('testdaEmail@gmail.com', 'Northman', 'test', 'user');

    const channel = requestChannelsCreateV3(user.token, 'testchannel', true);
    const channel2 = requestChannelsCreateV3(user2.token, 'testcdadhannel', true);

    const dm = requestDmCreateV2(user.token, []);
    const dm2 = requestDmCreateV2(user2.token, [user.authUserId]);
    requestChannelJoinV3(user.token, channel2.channelId);
    requestSendDm(user.token, dm.dmId, 'Test message');
    requestSendDm(user.token, dm2.dmId, 'indianidnia');
    requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    requestSendDm(user.token, dm.dmId, 'Test message');
    requestSendDm(user.token, dm2.dmId, 'indianidnia');
    requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    requestSendDm(user.token, dm.dmId, 'Test message');
    requestSendDm(user.token, dm2.dmId, 'indianidnia');
    requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    const result = requestUserStats(user.token);
    expect(result).toStrictEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }, { numChannelsJoined: 1, timeStamp: expect.any(Number) }, { numChannelsJoined: 2, timeStamp: expect.any(Number) }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }, { numDmsJoined: 1, timeStamp: expect.any(Number) }, { numDmsJoined: 2, timeStamp: expect.any(Number) }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }, { numMessagesSent: 1, timeStamp: expect.any(Number) }, { numMessagesSent: 2, timeStamp: expect.any(Number) }, { numMessagesSent: 3, timeStamp: expect.any(Number) }, { numMessagesSent: 4, timeStamp: expect.any(Number) }, { numMessagesSent: 5, timeStamp: expect.any(Number) }, { numMessagesSent: 6, timeStamp: expect.any(Number) }, { numMessagesSent: 7, timeStamp: expect.any(Number) }, { numMessagesSent: 8, timeStamp: expect.any(Number) }, { numMessagesSent: 9, timeStamp: expect.any(Number) }],
        involvementRate: expect.any(Number),
      }
    });

    requestChannelLeaveV2(user.token, channel2.channelId);
    requestDmRemoveV2(user.token, dm.dmId);
    requestDmLeaveV2(user.token, dm2.dmId);
    const result2 = requestUserStats(user.token);
    expect(result2).toStrictEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }, { numChannelsJoined: 1, timeStamp: expect.any(Number) }, { numChannelsJoined: 2, timeStamp: expect.any(Number) }, { numChannelsJoined: 1, timeStamp: expect.any(Number) }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }, { numDmsJoined: 1, timeStamp: expect.any(Number) }, { numDmsJoined: 2, timeStamp: expect.any(Number) }, { numDmsJoined: 1, timeStamp: expect.any(Number) }, { numDmsJoined: 0, timeStamp: expect.any(Number) }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }, { numMessagesSent: 1, timeStamp: expect.any(Number) }, { numMessagesSent: 2, timeStamp: expect.any(Number) }, { numMessagesSent: 3, timeStamp: expect.any(Number) }, { numMessagesSent: 4, timeStamp: expect.any(Number) }, { numMessagesSent: 5, timeStamp: expect.any(Number) }, { numMessagesSent: 6, timeStamp: expect.any(Number) }, { numMessagesSent: 7, timeStamp: expect.any(Number) }, { numMessagesSent: 8, timeStamp: expect.any(Number) }, { numMessagesSent: 9, timeStamp: expect.any(Number) }],
        involvementRate: expect.any(Number),
      }
    });
  });
}
);

describe('user/profile/uploadphoto/v1', () => {
  test('Success', () => {
    requestClearV1();
    const user = requestRegisterV3('testEmail@gmail.com', 'Northman', 'test', 'user');
    requestPhotoUpload(user.token, 'https://t3.ftcdn.net/jpg/03/46/83/96/360_F_346839683_6nAPzbhpSkIpb8pmAwufkC7c5eD7wYws.jpg', 0, 200, 0, 200);
    requestClearV1();
  });
});
