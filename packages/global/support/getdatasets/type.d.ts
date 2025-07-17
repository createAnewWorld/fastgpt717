export type getDatasetsModelSchema = {
  _id: string; // 默认MongoDB的ObjectId类型，可以根据实际情况调整
  name: string; // 知识库名字
  teamId: string; // 外部链接ID，optional字段
  tmbId: string;
};
