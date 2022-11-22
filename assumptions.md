**Assumptions:**

- **Assume password has a maximum of 200 characters**
	(We do not want a user to be able to store an endlessly long password)
- **Assume only correct specified types are passed into functions and/or if incorrect types are   passed, the program will return the relevent error message for that parameter**
	(We assume that in the case that an incorrect type is passed, the program will simply throw an error to prevent further undefined behaviour)
- **Assume only standard english ASCII characters (dec 32 - 126) are passed into function strings**
	(This avoids dealing with other langauges, and for our sake we can assume the locale environment will not change)  
- **Assume channelIds and userIds will be unique/are only linked to one channel/user**
	(We want to identify users based on something guaranteed to be unique, not their name or something that can be a duplicate for example)
- **Assume for iteration 1 at least, that a user can use functions without needing to strictly log in (via authLoginV1)**
	(The spec does not say if this is required or how it should be implemented, so for now we will assume login is unneccesary)
- **Assume number of users/channels in the dataStore will not be excessively big (i.e < 50)**
	(The spec does not mention the potential audience size of BEANS, so we will assume it is a relatively small localised program. This means code efficiency is less of a priority.)
- **Assume channel names not unique. Channels will be identified by their id on creation**
	- no mention in spec of unique channel names

- **Assume input authUserId is not always Valid**
- **Assume the function is not always written correctly**
- **Assume input channelId is not always Valid**
- **Assume not all individual return values are returned as single values rather than being stored in an object**
- **Assume not all groups store their data in a field called data which is located in dataStore.js**

