```javascript
let data = {
    channels: [
        {
            channelId: 1,
            channelName: 'My Channel',
            memberIds: [1],
            isPublic: true,
            ownerIds: [1],
            messages: [
                {
                    messageId: 1,
                    uId: 1,
                    message: 'Hello world',
                    timeSent: 1582426789,
                },
            ],
        },
    ],
    users: [
        {
            uId: 1,
            email: 'example@gmail.com',
            nameFirst: 'Hayden',
            nameLast: 'Jacobs',
            handleStr: 'haydenjacobs',
            handleStrDisplay: uniqueHandle,
            handleInt: highestHandleInt,
            password: "password",
            channelIds: [1],
            ownedChannelIds: [1],
            dmIds: [1],
            ownedDmIds: [1],
        }
    ],
     directMessages: [
        {   
            dmId: number
            name: auto generated based on member names
            owner: creator of channel
            members: [] - array of userIds. Can extrapolate out the user objects using userProfile function
            messages: [
                {
                    messageId: 1,
                    uId: 1,
                    message: 'Hello world',
                    timeSent: 1582426789,
                }
            ] - array of objects like with channels above
        }
    ]
}
```

[Optional] short description: 

For channel data, we decided to store the following:
- channelId (number)
- name (string)
- userIds (array of userId numbers in channel)
- ownerUsers (array of userId numbers whom own the channel)
- messages (list of messages objects within the channel)

For user data, we decided to store the following
- uId (unique user number)
- email (user email string
- nameFirst (first name string)
- nameLast (last name string)
- handleStr (user handle string)
- handleStrDisplay (display name)
- handleInt (suffixed onto handle Str for display)
- password (user password -- we were not sure if it was wise to store passwords here however)
- channelIds (list of channelIds that the user is in)
- ownedChannelIds (list of channelIds that the user owns)

For directMessages
- Message Ids must be completely unique even if from another channel or dm