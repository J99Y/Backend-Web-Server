import request, { HttpVerb } from 'sync-request';
import config from '../config.json';

const port = config.port;
const url = config.url;

const SERVER_URL = url + ':' + port;

function requestHelper(method: HttpVerb, path: string, payload: object, token?: string) {
  let qs = {};
  let json = {};
  const headers = { token };
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }

  const res = request(method, SERVER_URL + path, { qs, json, headers });
  if (res.statusCode !== 200) {
    // Return error code number instead of object in case of error.
    // (just for convenience)
    return res.statusCode;
  }

  return JSON.parse(res.getBody() as string);
}

// -------------------------------- //
// -----------Auth Routes---------- //

export function requestRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  return requestHelper('POST', '/auth/register/v3', { email, password, nameFirst, nameLast });
}

export function requestLoginV3(email: string, password: string) {
  return requestHelper('POST', '/auth/login/v3', { email, password });
}

export function requestLogoutV2(token: string) {
  return requestHelper('POST', '/auth/logout/v2', {}, token);
}

export function requestPasswordResetV1(email: string) {
  return requestHelper('POST', '/auth/passwordreset/request/v1', { email });
}

export function requestResetPasswordV1(resetCode: string, newPassword: string) {
  return requestHelper('POST', '/auth/passwordreset/reset/v1', { resetCode, newPassword });
}

// -------------------------------- //
// ---------Channels Routes-------- //

export function requestChannelsCreateV3(token: string, name: string, isPublic: boolean) {
  return requestHelper('POST', '/channels/create/v3', { name, isPublic }, token);
}

export function requestChannelsListV3(token: string) {
  return requestHelper('GET', '/channels/list/v3', {}, token);
}

export function requestChannelsListAllV3(token: string) {
  return requestHelper('GET', '/channels/listAll/v3', {}, token);
}

// -------------------------------- //
// ---------Channel Routes--------- //
export function requestChannelDetailsV3(token: string, channelId: number) {
  return requestHelper('GET', '/channel/details/v3', { channelId }, token);
}

export function requestChannelInviteV3(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/invite/v3', { channelId, uId }, token);
}

export function requestChannelJoinV3(token: string, channelId: number) {
  return requestHelper('POST', '/channel/join/v3', { channelId }, token);
}

export function requestChannelLeaveV2(token: string, channelId: number) {
  return requestHelper('POST', '/channel/leave/v2', { channelId }, token);
}

export function requestChannelAddOwnerV2(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/addowner/v2', { channelId, uId }, token);
}

export function requestChannelRemoveOwnerV2(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/removeowner/v2', { channelId, uId }, token);
}
export function requestChannelMessagesV3(token: string, channelId: number, start: number) {
  return requestHelper('GET', '/channel/messages/v3', { channelId, start }, token);
}

// -------------------------------- //
// ---------Messages Routes-------- //

export function requestMessageSendV2(token: string, channelId: number, message: string) {
  return requestHelper('POST', '/message/send/v2', { channelId, message }, token);
}

export function requestMessageSendLaterV1(token: string, channelId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlater/v1', { channelId, message, timeSent }, token);
}

export function requestMessageEditV2(token: string, messageId: number, message: string) {
  return requestHelper('PUT', '/message/edit/v2', { messageId, message }, token);
}

export function requestMessageRemoveV2(token: string, messageId: number) {
  return requestHelper('DELETE', '/message/remove/v2', { messageId }, token);
}

export function requestMessageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  return requestHelper('POST', '/message/share/v1', { ogMessageId, message, channelId, dmId }, token);
}

export function requestMessagePinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/pin/v1', { messageId }, token);
}

export function requestMessageUnpinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/unpin/v1', { messageId }, token);
}

export function requestMessageReactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/react/v1', { messageId, reactId }, token);
}

export function requestMessageUnreactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/unreact/v1', { messageId, reactId }, token);
}

// -------------------------------- //
// ------------Dm Routes----------- //

export function requestDmDetailsV2(token: string, dmId: number) {
  return requestHelper('GET', '/dm/details/v2', { dmId }, token);
}

export function requestDmListV2(token: string) {
  return requestHelper('GET', '/dm/list/v2', {}, token);
}

export function requestDmRemoveV2(token: string, dmId: number) {
  return requestHelper('DELETE', '/dm/remove/v2', { dmId }, token);
}

export function requestDmCreateV2(token: string, uIds: number[]) {
  return requestHelper('POST', '/dm/create/v2', { uIds }, token);
}

export function requestDmLeaveV2(token: string, dmId: number) {
  return requestHelper('POST', '/dm/leave/v2', { dmId }, token);
}

export function requestMessagesDm(token: string, dmId: number, start: number) {
  return requestHelper('GET', '/dm/messages/v2', { dmId, start }, token);
}

export function requestSendDm(token: string, dmId: number, message: string) {
  return requestHelper('POST', '/message/senddm/v2', { dmId, message }, token);
}

export function requestSendLaterDm(token: string, dmId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlaterdm/v1', { dmId, message, timeSent }, token);
}

// -------------------------------- //
// -----------User Routes---------- //

export function requestUserProfileV3(token: string, uId: number) {
  return requestHelper('GET', '/user/profile/v3', { uId }, token);
}

export function requestSetHandleV2(token: string, handleStr: string) {
  return requestHelper('PUT', '/user/profile/sethandle/v2', { handleStr }, token);
}

export function requestSetEmailV2(token: string, email: string) {
  return requestHelper('PUT', '/user/profile/setemail/v2', { email }, token);
}

export function requestSetNameV2(token: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/user/profile/setname/v2', { nameFirst, nameLast }, token);
}

export function requestUsersAllV2(token: string) {
  return requestHelper('GET', '/users/all/v2', {}, token);
}

export function requestUserStats(token: string) {
  return requestHelper('GET', '/user/stats/v1', {}, token);
}

export function requestPhotoUpload(token: string, url: string, startX: number, endX: number, startY: number, endY: number) {
  return requestHelper('POST', '/user/profile/uploadphoto/v1', {
    imgUrl: url,
    xStart: startX,
    yStart: startY,
    xEnd: endX,
    yEnd: endY
  }, token);
}

// -------------------------------- //
// ----------Other Routes---------- //

export function requestClearV1() {
  return requestHelper('DELETE', '/clear/v1', {});
}

// ----------------------------------- //
// ---Notifications Server Request--- //

export function requestNotificationsV1(token: string) {
  return requestHelper('GET', '/notifications/get/v1', {}, token);
}

// ----------------------------- //
// ---Search Server Requests--- //

export function requestSearchV1(token: string, queryStr: string) {
  return requestHelper('GET', '/search/v1', { queryStr }, token);
}

// ----------------------------- //
// -------Standup Requests------ //

export function requestStandupStartV1(token: string, channelId: number, length: number) {
  return requestHelper('POST', '/standup/start/v1', { channelId, length }, token);
}

export function requestStandupActiveV1(token: string, channelId: number) {
  return requestHelper('GET', '/standup/active/v1', { channelId }, token);
}

export function requestStandupSendV1(token: string, channelId: number, message: string) {
  return requestHelper('POST', '/standup/send/v1', { channelId, message }, token);
}

export function requestUsersStats(token: string) {
  return requestHelper('GET', '/users/stats/v1', {}, token);
}

// ----------------------------- //
// ---Admin User Request--- //
export function requestAdminUserRemoveV1(token: string, uId: number) {
  return requestHelper('DELETE', '/admin/user/remove/v1', { uId }, token);
}

export function requestAdminUserperimissionV1(token: string, uId: number, permissionId: number) {
  return requestHelper('POST', '/admin/userpermission/change/v1', { uId, permissionId }, token);
}
