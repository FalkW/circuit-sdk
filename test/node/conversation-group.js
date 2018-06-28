'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
describe('Group Conversation', () => {

    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should create a group conversation and raise a conversationCreated event', async () => {
        const topic = `${Date.now()}a`;
        const res = await Promise.all([
            client.createGroupConversation([user2.userId], topic),
            helper.expectEvents(client, [{
                type: 'conversationCreated',
                predicate: evt => evt.conversation.topic === topic && evt.conversation.participants.includes(user.userId) && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        conversation = res[0];
        assert(conversation && conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });

    it('should remove the second participant from the conversation and raise a conversationUpdated event', async () => {
        const res = await Promise.all([
            client.removeParticipant(conversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && !evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[1].conversation.convId === conversation.convId && !res[1].conversation.participants.includes(user2.userId)) {  
            conversation = res[1].conversation;
            assert(true);
        } else {
            assert(false);
        }
    });

    it('should add the second participant to the conversation and raise a conversationUpdated event', async () => {
        const res = await Promise.all([
            client.addParticipant(conversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[0].convId === conversation.convId && res[0].participants.includes(user2.userId)) {  
            conversation = res[0];
            assert(true);
        } else {
            assert(false);
        }
    });

    it('should get the participants of the conversation', async () => {
        const res = await client.getConversationParticipants(conversation.convId);
        res.participants.forEach(participant => {
            if (!(participant.userId === user.userId || participant.userId === user2.userId)) {
                assert(false);
            }
        });
    });
});