import {
  requestUsersStats,
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
  requestMessageRemoveV2
} from './testRequestRoutes';

describe('users/stats/v1', () => {
  test('Invalid Token', () => {
    const result = requestUsersStats('notvalidtoken');
    expect(result).toEqual(403);
  });

  test('Success - initial creation', () => {
    const user = requestRegisterV3('test@gmail.com', 'Northman', 'test', 'user');
    const result = requestUsersStats(user.token);
    expect(result).toStrictEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.any(Number) }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.any(Number) }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.any(Number) }],
        utilizationRate: expect.any(Number),
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
    const message = requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    requestSendDm(user.token, dm.dmId, 'Test message');
    requestSendDm(user.token, dm2.dmId, 'indianidnia');
    requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    requestSendDm(user.token, dm.dmId, 'Test message');
    requestSendDm(user.token, dm2.dmId, 'indianidnia');
    requestMessageSendV2(user.token, channel.channelId, 'channel test message');
    const result = requestUsersStats(user.token);
    expect(result).toStrictEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.any(Number) }, { numChannelsExist: 1, timeStamp: expect.any(Number) }, { numChannelsExist: 2, timeStamp: expect.any(Number) }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.any(Number) }, { numDmsExist: 1, timeStamp: expect.any(Number) }, { numDmsExist: 2, timeStamp: expect.any(Number) }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.any(Number) }, { numMessagesExist: 1, timeStamp: expect.any(Number) }, { numMessagesExist: 2, timeStamp: expect.any(Number) }, { numMessagesExist: 3, timeStamp: expect.any(Number) }, { numMessagesExist: 4, timeStamp: expect.any(Number) }, { numMessagesExist: 5, timeStamp: expect.any(Number) }, { numMessagesExist: 6, timeStamp: expect.any(Number) }, { numMessagesExist: 7, timeStamp: expect.any(Number) }, { numMessagesExist: 8, timeStamp: expect.any(Number) }, { numMessagesExist: 9, timeStamp: expect.any(Number) }],
        utilizationRate: expect.any(Number),
      }
    });

    requestChannelLeaveV2(user.token, channel2.channelId);
    requestDmRemoveV2(user.token, dm.dmId);
    requestDmLeaveV2(user.token, dm2.dmId);
    requestMessageRemoveV2(user.token, message.messageId);
    const result2 = requestUsersStats(user.token);
    expect(result2).toStrictEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.any(Number) }, { numChannelsExist: 1, timeStamp: expect.any(Number) }, { numChannelsExist: 2, timeStamp: expect.any(Number) }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.any(Number) }, { numDmsExist: 1, timeStamp: expect.any(Number) }, { numDmsExist: 2, timeStamp: expect.any(Number) }, { numDmsExist: 1, timeStamp: expect.any(Number) }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.any(Number) }, { numMessagesExist: 1, timeStamp: expect.any(Number) }, { numMessagesExist: 2, timeStamp: expect.any(Number) }, { numMessagesExist: 3, timeStamp: expect.any(Number) }, { numMessagesExist: 4, timeStamp: expect.any(Number) }, { numMessagesExist: 5, timeStamp: expect.any(Number) }, { numMessagesExist: 6, timeStamp: expect.any(Number) }, { numMessagesExist: 7, timeStamp: expect.any(Number) }, { numMessagesExist: 8, timeStamp: expect.any(Number) }, { numMessagesExist: 9, timeStamp: expect.any(Number) }, { numMessagesExist: 6, timeStamp: expect.any(Number) }, { numMessagesExist: 5, timeStamp: expect.any(Number) }],
        utilizationRate: expect.any(Number),
      }
    });
  });
}
);
