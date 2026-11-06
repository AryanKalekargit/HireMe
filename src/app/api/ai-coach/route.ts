import { POST as handleChat } from '../career-coach/chat/route';

export async function POST(req: Request) {
    return handleChat(req);
}
