import { POST as handle } from "../../webhook/route";

export async function POST(req: Request) {
  return handle(req);
}
