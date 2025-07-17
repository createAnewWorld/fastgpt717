export type getUserModelSchema = {
  _id: string; // 默认MongoDB的ObjectId类型，可以根据实际情况调整
  username: string; // 用户ID
  password: string; // 外部链接ID，optional字段
};
