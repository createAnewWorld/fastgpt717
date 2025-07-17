import { connectionMongo, getMongoModel } from '../../common/mongo';
const { Schema } = connectionMongo;
import type { getUserModelSchema } from '@fastgpt/global/support/getUser/type';
// 定义 MongoDB Schema
const getUserOutLinkSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
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
export const MongogetUser = getMongoModel<getUserModelSchema>('users', getUserOutLinkSchema);
console.log(MongogetUser.collection.name);
