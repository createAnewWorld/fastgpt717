import type { NextApiRequest, NextApiResponse } from 'next';
import { MongogetUser } from '@fastgpt/service/support/getUser/myuser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.query;
  if (!username) {
    console.log('username1', username);
    return res.status(400).json({ error: 'Missing userid' });
  }

  try {
    // const userOutLinkData = await MongoUserOutLink.find({userid:1}).lean();

    // const userOutLinkData = await MongoUserOutLink.findOne({  userid:"1"}).lean();
    // const userOutLinkData = await MongoUserOutLink.findOne({ userid:'1'}).lean();
    const userOutLinkData = await MongogetUser.find().lean();
    // let  userOutLinkDataresult =null;
    // for (let i = 0; i < userOutLinkData.length; i++) {
    //   if (String(userOutLinkData[i].userid) === String(userid)) {
    //     userOutLinkDataresult=userOutLinkData[i];
    //     console.log("找到匹配的用户数据:", userOutLinkData[i]);
    //   }
    // }
    console.log('username222', username);
    console.log('username3', userOutLinkData);
    const userOutLinkDataresult = userOutLinkData.find(
      (item) => String(item.username) === String(username + '+ILOVEYOU')
    );

    console.log('username4', userOutLinkDataresult);
    // const userOutLinkDataresult = userOutLinkData.find(item => item.userid === userid);
    res.status(200).json({ data: userOutLinkDataresult, query: { username: username } });
  } catch (error) {
    console.error('MongoDB 查询错误:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
