import { connectionMongo, getMongoModel } from '../../common/mongo';
const { Schema } = connectionMongo;
import type { getDatasetsModelSchema } from '@fastgpt/global/support/getdatasets/type';
// 定义 MongoDB Schema
const getUserOutLinkSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
    required: false
  }
});

// 创建索引（提高查询性能）
try {
  getUserOutLinkSchema.index({ userid: 1 });
} catch (error) {
  console.log(error);
}

// 创建 Mongoose Model 并导出
export const MongogetDatasets = getMongoModel<getDatasetsModelSchema>(
  'datasets',
  getUserOutLinkSchema
);
console.log(MongogetDatasets.collection.name);
