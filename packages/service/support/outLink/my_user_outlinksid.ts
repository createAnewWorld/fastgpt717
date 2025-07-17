import { connectionMongo, getMongoModel } from '../../common/mongo';
const { Schema } = connectionMongo;
import type { UserOutLinkModelSchema } from '../../../global/support/chart/type.d.ts';
// 定义 MongoDB Schema
const UserOutLinkSchema = new Schema({
  userid: {
    type: String,
    required: true
  },
  outlinksid: {
    type: String,
    required: false
  }
});

// 创建索引（提高查询性能）
try {
  UserOutLinkSchema.index({ userid: 1 });
} catch (error) {
  console.log(error);
}

// 创建 Mongoose Model 并导出
export const MongoUserOutLink = getMongoModel<UserOutLinkModelSchema>(
  'my_user_outlinksids',
  UserOutLinkSchema
);
console.log(MongoUserOutLink.collection.name);
