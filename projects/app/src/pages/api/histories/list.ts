import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoUserOutLink } from '../../../../../../packages/service/support/outLink/my_user_outlinksid';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userid } = req.query;
  if (!userid) {
    console.log('userid', userid);
    return res.status(400).json({ error: 'Missing userid' });
  }

  try {
    //await connectToDatabase();

    // const userOutLinkData = await MongoUserOutLink.find({userid:1}).lean();

    // const userOutLinkData = await MongoUserOutLink.findOne({  userid:"1"}).lean();
    // const userOutLinkData = await MongoUserOutLink.findOne({ userid:'1'}).lean();
    const userOutLinkData = await MongoUserOutLink.find().lean();
    // let  userOutLinkDataresult =null;
    // for (let i = 0; i < userOutLinkData.length; i++) {
    //   if (String(userOutLinkData[i].userid) === String(userid)) {
    //     userOutLinkDataresult=userOutLinkData[i];
    //     console.log("找到匹配的用户数据:", userOutLinkData[i]);
    //   }
    // }

    const userOutLinkDataresult = userOutLinkData.find(
      (item) => String(item.userid) === String(userid)
    );
    // const userOutLinkDataresult = userOutLinkData.find(item => item.userid === userid);
    res.status(200).json({ data: userOutLinkDataresult, query: { userid: userid } });
  } catch (error) {
    console.error('MongoDB 查询错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
