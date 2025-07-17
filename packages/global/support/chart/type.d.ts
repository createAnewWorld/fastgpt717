export type UserOutLinkModelSchema = {
  _id: string; // 默认MongoDB的ObjectId类型，可以根据实际情况调整
  userid: string; // 用户ID
  outlinksid: string; // 外部链接ID，optional字段
};
