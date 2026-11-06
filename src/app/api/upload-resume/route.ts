import { POST as handleUpload, GET as handleGet } from '../resume/upload/route';

export async function POST(req: Request) {
    return handleUpload(req);
}

export async function GET() {
    return handleGet();
}
