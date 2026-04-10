import { type message, chatMessages } from "../store/chat.store.js";

export const addChatMessage = (userId: string, message: message) => {
  if (!chatMessages.has(userId)) {
    chatMessages.set(userId, []);
  }
  chatMessages.get(userId)?.push(message);
};

export const getChatMessages = (roomId: string): message[] => {
  const messages: message[] = [];
  chatMessages.forEach((userMessages) => {
    userMessages.forEach((msg) => {
      if (msg.roomId === roomId) {
        messages.push(msg);
      }
    });
  });
  return messages;
};
