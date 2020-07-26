import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { Model } from "dynamoose/dist/Model";

export interface trackRecord {
  domainName: string;
  recType: string;
  data: Set<string>;
  timestamp: Number;
}

interface trackItem extends trackRecord {
  pk: string;
}

export interface repository {
  putRecord(records: trackRecord[]): Promise<any>;
}

export class dynamoRepository {
  model: Document & Model<Document>;

  constructor(tableName: string) {
    const schema = new dynamoose.Schema(
      {
        pk: { hashKey: true, type: String },
      },
      {
        saveUnknown: true,
      }
    );
    this.model = dynamoose.model(tableName, schema, {
      create: false,
    });
  }

  async putRecord(records: trackRecord[]) {
    const items = records.map(
      (r): trackItem => Object.assign(r, { pk: `${r.domainName}:${r.recType}` })
    );
    return this.model.batchPut(records);
  }
}
