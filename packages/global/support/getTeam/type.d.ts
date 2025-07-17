export type getTeamModelSchema = {
  _id: string; // 默认MongoDB的ObjectId类型，可以根据实际情况调整
  userId: string; // 用户ID
  teamId: string; // 外部链接ID，optional字段
};
