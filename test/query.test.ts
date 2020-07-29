import { handler, arguments } from "../lib/lambda/query";
import { trackRecord } from "../lib/lambda/dynamodb";

export class testRepository {
  records: trackRecord[];

  constructor() {
    this.records = [];
  }

  async putRecord(records: trackRecord[]) {
    this.records = this.records.concat(records);
    return "ok";
  }
}

test("Handler basic", async () => {
  const dummyRepo = new testRepository();
  const args: arguments = {
    domainNames: ["redmagic.org"],
    repo: dummyRepo,
  };

  const result = await handler(args);
  expect(result).toBe("ok");
  expect(dummyRepo.records.length).toBe(1);
  expect(dummyRepo.records[0].domainName).toBe("redmagic.org");
  expect(dummyRepo.records[0].data.size).toBeGreaterThan(0);
});
