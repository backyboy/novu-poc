import { expect } from 'chai';
import axios from 'axios';
import { ChannelTypeEnum, MarkMessagesAsEnum } from '@novu/shared';
import { UserSession } from '@novu/testing';
import { NotificationTemplateEntity, MessageRepository } from '@novu/dal';

const axiosInstance = axios.create();

describe('Mark All Subscriber Messages - /subscribers/:subscriberId/messages/mark-all (POST)', function () {
  let session: UserSession;
  let template: NotificationTemplateEntity;
  const messageRepository = new MessageRepository();

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
    template = await session.createTemplate();
    await messageRepository.deleteMany({
      _environmentId: session.environment._id,
      _subscriberId: session.subscriberId,
    });
  });

  it("should throw not found when subscriberId doesn't exist", async function () {
    const fakeSubscriberId = 'asdfasdfasdf';
    try {
      await markAllSubscriberMessagesAs(session, fakeSubscriberId, MarkMessagesAsEnum.READ);
    } catch (error) {
      expect(error.response.status).to.equal(404);
      expect(error.response.data.message).to.equal(
        `Subscriber ${fakeSubscriberId} does not exist in environment ${session.environment._id}, ` +
          'please provide a valid subscriber identifier'
      );
    }
  });

  it('should mark all the subscriber messages as read', async function () {
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);

    await session.awaitRunningJobs(template._id);

    const notificationsFeedResponse = await getSubscriberNotifications(session, session.subscriberId);
    expect(notificationsFeedResponse.totalCount).to.equal(5);

    const messagesMarkedAsReadResponse = await markAllSubscriberMessagesAs(
      session,
      session.subscriberId,
      MarkMessagesAsEnum.READ
    );
    expect(messagesMarkedAsReadResponse.data).to.equal(5);

    const feed = await messageRepository.find({
      _environmentId: session.environment._id,
      subscriberId: session.subscriberId,
      channel: ChannelTypeEnum.IN_APP,
      seen: true,
      read: true,
    });

    expect(feed.length).to.equal(5);
    for (const message of feed) {
      expect(message.seen).to.equal(true);
      expect(message.read).to.equal(true);
    }
  });

  it('should not mark all the messages as read if they are already read', async function () {
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);

    await session.awaitRunningJobs(template._id);

    const notificationsFeedResponse = await getSubscriberNotifications(session, session.subscriberId);
    expect(notificationsFeedResponse.totalCount).to.equal(5);

    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        subscriberId: session.subscriberId,
        channel: ChannelTypeEnum.IN_APP,
        seen: false,
        read: false,
      },
      { $set: { read: true, seen: true } }
    );

    const messagesMarkedAsReadResponse = await markAllSubscriberMessagesAs(
      session,
      session.subscriberId,
      MarkMessagesAsEnum.READ
    );
    expect(messagesMarkedAsReadResponse.data).to.equal(0);

    const feed = await messageRepository.find({
      _environmentId: session.environment._id,
      subscriberId: session.subscriberId,
      channel: ChannelTypeEnum.IN_APP,
      seen: true,
      read: true,
    });

    expect(feed.length).to.equal(5);
    for (const message of feed) {
      expect(message.seen).to.equal(true);
      expect(message.read).to.equal(true);
    }
  });

  it('should mark all the subscriber messages as unread', async function () {
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);

    await session.awaitRunningJobs(template._id);

    const notificationsFeedResponse = await getSubscriberNotifications(session, session.subscriberId);
    expect(notificationsFeedResponse.totalCount).to.equal(5);

    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        subscriberId: session.subscriberId,
        channel: ChannelTypeEnum.IN_APP,
        seen: false,
        read: false,
      },
      { $set: { read: true, seen: true } }
    );

    const messagesMarkedAsReadResponse = await markAllSubscriberMessagesAs(
      session,
      session.subscriberId,
      MarkMessagesAsEnum.UNREAD
    );
    expect(messagesMarkedAsReadResponse.data).to.equal(5);

    const feed = await messageRepository.find({
      _environmentId: session.environment._id,
      subscriberId: session.subscriberId,
      channel: ChannelTypeEnum.IN_APP,
      seen: true,
      read: false,
    });

    expect(feed.length).to.equal(5);
    for (const message of feed) {
      expect(message.seen).to.equal(true);
      expect(message.read).to.equal(false);
    }
  });

  it('should mark all the subscriber messages as seen', async function () {
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);

    await session.awaitRunningJobs(template._id);

    const notificationsFeedResponse = await getSubscriberNotifications(session, session.subscriberId);
    expect(notificationsFeedResponse.totalCount).to.equal(5);

    const messagesMarkedAsReadResponse = await markAllSubscriberMessagesAs(
      session,
      session.subscriberId,
      MarkMessagesAsEnum.SEEN
    );
    expect(messagesMarkedAsReadResponse.data).to.equal(5);

    const feed = await messageRepository.find({
      _environmentId: session.environment._id,
      subscriberId: session.subscriberId,
      channel: ChannelTypeEnum.IN_APP,
      seen: true,
      read: false,
    });

    expect(feed.length).to.equal(5);
    for (const message of feed) {
      expect(message.seen).to.equal(true);
      expect(message.read).to.equal(false);
    }
  });

  it('should mark all the subscriber messages as unseen', async function () {
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);
    await session.triggerEvent(template.triggers[0].identifier, session.subscriberId);

    await session.awaitRunningJobs(template._id);

    const notificationsFeedResponse = await getSubscriberNotifications(session, session.subscriberId);
    expect(notificationsFeedResponse.totalCount).to.equal(5);

    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        subscriberId: session.subscriberId,
        channel: ChannelTypeEnum.IN_APP,
        seen: false,
        read: false,
      },
      { $set: { seen: true } }
    );

    const messagesMarkedAsReadResponse = await markAllSubscriberMessagesAs(
      session,
      session.subscriberId,
      MarkMessagesAsEnum.UNSEEN
    );
    expect(messagesMarkedAsReadResponse.data).to.equal(5);

    const feed = await messageRepository.find({
      _environmentId: session.environment._id,
      subscriberId: session.subscriberId,
      channel: ChannelTypeEnum.IN_APP,
      seen: false,
      read: false,
    });

    expect(feed.length).to.equal(5);
    for (const message of feed) {
      expect(message.seen).to.equal(false);
      expect(message.read).to.equal(false);
    }
  });
});

async function markAllSubscriberMessagesAs(session: UserSession, subscriberId: string, markAs: MarkMessagesAsEnum) {
  const response = await axiosInstance.post(
    `${session.serverUrl}/v1/subscribers/${subscriberId}/messages/mark-all`,
    {
      markAs,
    },
    {
      headers: {
        authorization: `ApiKey ${session.apiKey}`,
      },
    }
  );

  return response.data;
}

async function getSubscriberNotifications(session: UserSession, subscriberId: string) {
  const response = await axios.get(`${session.serverUrl}/v1/subscribers/${session.subscriberId}/notifications/feed`, {
    params: {
      limit: 100,
    },
    headers: {
      authorization: `ApiKey ${session.apiKey}`,
    },
  });

  return response.data;
}
