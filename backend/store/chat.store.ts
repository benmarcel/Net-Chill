export interface message {
username: string;
message: string;
sentAt: number;
roomId: string;
}

export const chatMessages = new Map<string, message[]>();