import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();
const sqsClient = new SQSClient({ region: process.env.SQS_REGION });

export const handler = async () => {
  const params = (usersChunk) => ({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(usersChunk),
    MessageGroupId: "default-group",
  });

  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/get-users`);
    const response = await res.json();
  
    const users = chunckArray(response.users, 20);
    for (const usersChunk of users) {
      const command = new SendMessageCommand(params(usersChunk));
      const result = await sqsClient.send(command);
      console.log("Message sent successfully:", result.MessageId);
    }
    return { statusCode: 200, body: JSON.stringify({ message: "Messages sent successfully" }) };
  } catch (error) {
    console.error("Error sending message:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to send message" }) };
  }
};

function chunckArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
