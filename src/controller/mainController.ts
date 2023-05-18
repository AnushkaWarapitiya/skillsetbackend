/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import LabelTag from '../schema/tag';
import User from '../schema/user';
import UserInfo from '../schema/userinfo';
import Certification from '../schema/certification';
import Status from '../schema/status';
import SpecExp from '../schema/specexp';
import UserTag from '../schema/usertag';
import { Document } from 'mongoose';
interface SpecExpDocument extends Document {
  userid: string;
  specexp: string;
}

const router = express.Router();

router.get('/getLabels', async (req, res) => {

    const query = LabelTag.find();
  
    query.exec()
      .then((labelTagList: any) => {
  
        const resultArray = [];
        
        for (let i = 0; i < labelTagList.length ; i++){
  
          let labelTagListObj = {};
      
          labelTagListObj = {
            'label_tag_id'   : labelTagList[i]['lbltgid'],
            'label_tag_name' : labelTagList[i]['lbltgname'],
            'key'        : i+1
          };
          resultArray.push(labelTagListObj);
        }
        res.status(200).json(resultArray);
       
      })
      .catch((error: Error) => {
        console.error(error);
      });  

});

router.post('/search', async (req, res) => {

  try {

    const { jpLevel, language, certificate, expOver, expUnder } = req.body;  

    let expOverNum = 0;
    let expUnderNum = 0;


    let userIds: any[] = [];
    let labelIds: any[] = [];
    let responseData: any[] = [];
    let userDataList: any[] = [];

    if (expOver) {
      expOverNum = parseInt(expOver) * 12;
    } else {
      expOverNum = 0;
    }
    
    if (expUnder) {
      expUnderNum = parseInt(expUnder) * 12;
    } else {
      expUnderNum = 0;
    }

    if (language) {
      const labelQueries = await LabelTag.find({ lbltgname: { $in: language } }, 'lbltgid');
      labelIds = labelQueries.flat().map(result => result.lbltgid);
    }

    if (jpLevel){
      const jpLevelUserResult = await UserInfo.find({
        $and: [
          { jppassedlevel: { $regex: jpLevel ? jpLevel : "", $options: "i" } },
          { delflg: 0 }
        ]
      });
      
      const jpLevelUserIds = jpLevelUserResult.flat().map(result => result.userid);

        if (jpLevelUserIds.length>0 && (expOver || expUnder)) {
          
          const TotalExpresult = await findUserExpWithUserIds(jpLevelUserIds,expOverNum,expUnderNum);        
          const specUserIds = TotalExpresult.flat().map((result: { userid: any; }) => result.userid);

          const specExpresult = await findSpecExpWithUserIds(jpLevelUserIds,expOverNum,expUnderNum);         
          const specExpUserIds = specExpresult.flat().map((result: { userid: any; }) => result.userid);
  
          if(specUserIds.length > 0 && certificate) {
  
            const certificateResult = await Certification.find({$and: [
              { userid: { $in: specUserIds} },
              {  name: { $regex: certificate ? certificate : "", $options: "i" } }
            ]});
  
            const certificateUserIds = certificateResult.flat().map(result => result.userid);
  
            if (certificateUserIds.length> 0 && language) {
  
              const UserTagResult = await UserTag.find({$and: [
                {userid: { $in: certificateUserIds } },
                { lbltgid: { $in: labelIds } }
              ]});
  
              const userTagUserIds = UserTagResult.flat().map(result => result.userid);
  
              userDataList = await getUserDataWithSpecExp (userTagUserIds);
              responseData = userDataList;
            } else {
              responseData = await getUserDataWithTotalExp(certificateUserIds);
           }
            
          } else if (specExpUserIds > 0 && language) {
  
            const UserTagResult = await UserTag.find({$and: [
              {userid: { $in: specExpUserIds } },
              { lbltgid: { $in: labelIds } }
            ]});
  
            const userTagUserIds = UserTagResult.flat().map(result => result.userid);
            userDataList = await getUserDataWithSpecExp (userTagUserIds);
            responseData = userDataList;
          } else if (specUserIds.length > 0) {
            userDataList = await getUserDataWithTotalExp (specUserIds);
            responseData = userDataList;
          }
        } else if (jpLevelUserIds.length>0 && certificate) {
  
          const certificateResult = await Certification.find({$and: [
            { userid: { $in: jpLevelUserIds} },
            { name: { $regex: certificate ? certificate : "", $options: "i" } }
          ]});
  
          const certificateUserIds = certificateResult.flat().map(result => result.userid);
  
          if (certificateUserIds.length > 0 && language) {
  
            const UserTagResult = await UserTag.find({$and: [
              {userid: { $in: certificateUserIds } },
              { lbltgid: { $in: labelIds } }
            ]});
  
            const userTagUserIds = UserTagResult.flat().map(result => result.userid);
            userDataList = await getUserDataWithSpecExp (userTagUserIds);
            responseData = userDataList;
          } else {
            userDataList = await getUserDataWithTotalExp (certificateUserIds);
            responseData = userDataList;
          }
        } else if (jpLevelUserIds.length>0 && language) {
          const UserTagResult = await UserTag.find({$and: [
            {userid: { $in: jpLevelUserIds } },
            { lbltgid: { $in: labelIds } }
          ]});

          const userTagUserIds = UserTagResult.flat().map(result => result.userid);
          userDataList = await getUserDataWithTotalExp (userTagUserIds);
          responseData = userDataList;
        } else {
          userDataList = await getUserDataWithTotalExp (jpLevelUserIds);
          responseData = userDataList;
        }

    } else if (expOver || expUnder) {

      const UserExpresult = await findUserExp(expOverNum,expUnderNum);
      const expUserIds = UserExpresult.flat().map((result: { userid: any; }) => result.userid);
      

      const specExpUser = await findSpecExp(expOverNum,expUnderNum);
      const specExpUserIds = specExpUser.flat().map((result: { userid: any; }) => result.userid);

      if(expUserIds.length > 0 && certificate) {

        const certificateResult = await Certification.find({$and: [
          { userid: { $in: expUserIds} },
          {  name: { $regex: certificate ? certificate : "", $options: "i" } }
        ]});

        const certificateUserIds = certificateResult.flat().map(result => result.userid);

        if (language) {

          const certificateResult = await Certification.find({$and: [
            { userid: { $in: specExpUserIds} },
            {  name: { $regex: certificate ? certificate : "", $options: "i" } }
          ]});
  
          const certificateUserIds = certificateResult.flat().map(result => result.userid);

          const UserTagResult = await UserTag.find({$and: [
            {userid: { $in: certificateUserIds } },
            { lbltgid: { $in: labelIds } }
          ]});

          const userTagUserIds = UserTagResult.flat().map(result => result.userid);

          userDataList = await getUserDataWithSpecExp (userTagUserIds);
          responseData = userDataList;
        }         
          userDataList = await getUserDataWithTotalExp (certificateUserIds);
          responseData = userDataList;
        
      } else if (specExpUserIds.length > 0 && language) {

        const UserTagResult = await UserTag.find({$and: [
          {userid: { $in: specExpUserIds } },
          { lbltgid: { $in: labelIds } }
        ]});

        const userTagUserIds = UserTagResult.flat().map(result => result.userid);

        userDataList = await getUserDataWithSpecExp (userTagUserIds);
        responseData = userDataList;
      } else {
        userDataList = await getUserDataWithTotalExp(expUserIds);
        responseData = userDataList;
      }

    } else if (certificate){

      const certificateResult = await Certification.find({
        $and: [
          { name: { $regex: certificate ? certificate : "", $options: "i" } },
          { delflg: 0 }
        ]
      });

      const certificateUserIds = certificateResult.flat().map(result => result.userid);

      if (certificateUserIds.length>0 && language) {

        const UserTagResult = await UserTag.find({$and: [
          {userid: { $in: certificateUserIds } },
          { lbltgid: { $in: labelIds } }
        ]});

        const userTagUserIds = UserTagResult.flat().map(result => result.userid);
        userDataList = await getUserDataWithTotalExp(userTagUserIds);
        responseData = userDataList;
      } else {
        userDataList = await getUserDataWithTotalExp(certificateUserIds);
        responseData = userDataList;
      }

    } else if (language) {

      const userQueries = await UserTag.find({ lbltgid: { $in: labelIds } });
      userIds = userQueries.flat().map(result => result.userid);
      userDataList = await getUserDataWithTotalExp(userIds);
      responseData = userDataList;

    }
    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.post('/searchByKeyword', async (req, res) => {

  try {
    const searchKey = req.body.searchKeyword;
    const responseData: any[] = [];

    const results = await Promise.all([
      UserInfo.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { userid: { $regex: searchKey ? searchKey : "", $options: "i" } },
                  { totalexp: { $regex: searchKey, $options: "i" } },
                  { jppassedlevel: { $regex: searchKey ? searchKey : "", $options: "i" } },
                  { hourlywages: { $regex: searchKey, $options: "i" } },
                  { techskill: { $regex: searchKey, $options: "i" } }
                ]
              },
              { delflg: 0 } // Add this condition to check delflg = false
            ]
          }
        },
        {
          $group: {
            _id: "userid",
            userIds: { $push: "$userid" }
          }
        }
      ]),      
      User.aggregate([
        { $match: {$and: [{name: { $regex: searchKey? searchKey : "", $options: "i" } }, {delflg: 0}] }},
        { $group: {
            _id: "$name",
            userIds: { $push: "$userid" }
          }
        }
      ]),
      Status.find({ statusname: { $regex: searchKey? searchKey : "", $options: "i" } }),
      Certification.aggregate([
        { $match: {$and: [{name: { $regex: searchKey? searchKey : "", $options: "i" } }, {delflg: 0}] }},
        { $group: {
            _id: "$name",
            userIds: { $push: "$userid" }
          }
        }
      ]), 
      SpecExp.aggregate([
        { $match: {$and: [{content: { $regex: searchKey? searchKey : "", $options: "i" } }, {delflg: 0}] }},
        { $group: {
            _id: "$content",
            userIds: { $push: "$userid" }
          }
        }
      ]), 
    ]);

    if (Array.isArray(results[0]) && results[0].length > 0) {

      const userInfoData = results[0];
      const userDataList = [];
      let userData;
      const userIdArr: string[] = [];

      userInfoData.forEach((userInfo) => {
        userInfo.userIds.forEach((userId: string) => {
          if (!userIdArr.includes(userId)) {
            userIdArr.push(userId);
          }
        });
      });

      for (let i = 0; i< userIdArr.length; i++){

        const userID = userIdArr[i];
        const userinfos = await UserInfo.find({userid: userID});
        const userName = await getUserName(userID);
        const certificateName = await getCertificateName(userID);
        const content = await getContent(userID);
        const statusName = await getStatusName(userinfos[0].statusid);
        userData = {
          'userid' : userinfos[0].userid,
          'name' : userName,
          'hourlywages' : userinfos[0].hourlywages,
          'jppassedlevel': userinfos[0].jppassedlevel,
          'totalexp': userinfos[0].totalexp,
          'techskill': userinfos[0].techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        userDataList.push(userData); 
      }    
      responseData.push(userDataList); 
    }

    if (Array.isArray(results[1]) && results[1].length > 0) {

      const userInfoData = results[1];
      const userDataList = [];
      let userData;
      const userIdArr: string[] = [];

      userInfoData.forEach((userInfo) => {
        userInfo.userIds.forEach((userId: string) => {
          if (!userIdArr.includes(userId)) {
            userIdArr.push(userId);
          }
        });
      });

      for (let i = 0; i< userIdArr.length; i++){

        const userID = userIdArr[i];
        const userinfos = await UserInfo.find({userid: userID});
        const userName = await getUserName(userID);
        const certificateName = await getCertificateName(userID);
        const content = await getContent(userID);
        const statusName = await getStatusName(userinfos[0].statusid);
        userData = {
          'userid' : userinfos[0].userid,
          'name' : userName,
          'hourlywages' : userinfos[0].hourlywages,
          'jppassedlevel': userinfos[0].jppassedlevel,
          'totalexp': userinfos[0].totalexp,
          'techskill': userinfos[0].techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        userDataList.push(userData); 
      }    
      responseData.push(userDataList); 
    }

    if(Array.isArray(results[2]) && results[2].length > 0) {

      const statusData = results[2].map(({ statusname, statusid }) => ({ statusname, statusid }));
      const userDataArr: any[] = [];
      let userData = {};
      
      for (let i = 0; i < statusData.length ; i++) {
        const userinfos = await UserInfo.find({statusid: statusData[i]['statusid']});

        for (const userInfos of userinfos) {
          const userName = await getUserName(userInfos.userid);
          const certificateName = await getCertificateName(userInfos.userid);
          const content = await getContent(userInfos.userid);
          const statusName = await getStatusName(userInfos.statusid);

          userData = {
            'userid' : userInfos.userid,
            'name' : userName,
            'hourlywages' : userInfos.hourlywages,
            'jppassedlevel': userInfos.jppassedlevel,
            'totalexp': userInfos.totalexp,
            'techskill': userInfos.techskill,
            'certificate_name' : certificateName,
            'status_name': statusName,
            'content': content          
          };
          userDataArr.push(userData);
        }
      } 
      responseData.push(userDataArr);  
    } 

   if (Array.isArray(results[3]) && results[3].length > 0) {
      const certificateData = results[3];
      const userDataList = [];
      let userData;
      const userIdArr: string[] = [];

      certificateData.forEach((certificate) => {
        certificate.userIds.forEach((userId: string) => {
          if (!userIdArr.includes(userId)) {
            userIdArr.push(userId);
          }
        });
      });

      for (let i = 0; i < userIdArr.length ; i++) {

        const userID = userIdArr[i];
        const userinfos = await UserInfo.find({userid: userID});
        const userName = await getUserName(userID);
        const certificateName = await getCertificateName(userID);
        const content = await getContent(userID);
        const statusName = await getStatusName(userinfos[0].statusid);

        userData = {
          'userid' : userinfos[0].userid,
          'name' : userName,
          'hourlywages' : userinfos[0].hourlywages,
          'jppassedlevel': userinfos[0].jppassedlevel,
          'totalexp': userinfos[0].totalexp,
          'techskill': userinfos[0].techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        userDataList.push(userData); 
      }
      responseData.push(userDataList); 
    }

    if (Array.isArray(results[4]) && results[4].length > 0) {
      const specExpData = results[4];
      const userDataList = [];
      let userData;
      const userIdArr: string[] = [];

      specExpData.forEach((specExp) => {
        specExp.userIds.forEach((userId: string) => {
          if (!userIdArr.includes(userId)) {
            userIdArr.push(userId);
          }
        });
      });

      for (let i = 0; i < userIdArr.length ; i++) {

        const userID = userIdArr[i];
        const userinfos = await UserInfo.find({userid: userID});
        const userName = await getUserName(userID);
        const certificateName = await getCertificateName(userID);
        const content = await getContent(userID);
        const statusName = await getStatusName(userinfos[0].statusid);

        userData = {
          'userid' : userinfos[0].userid,
          'name' : userName,
          'hourlywages' : userinfos[0].hourlywages,
          'jppassedlevel': userinfos[0].jppassedlevel,
          'totalexp': userinfos[0].totalexp,
          'techskill': userinfos[0].techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        userDataList.push(userData); 
      }    
      responseData.push(userDataList); 
    }

    const uniqueResults = responseData.reduce((acc: any[], resultGroup: any[]) => {
      const uniqueUsers = new Set(acc.map(result => result.userid));
      const uniqueResultsGroup = resultGroup.filter(result => !uniqueUsers.has(result.userid));
      return [...acc, ...uniqueResultsGroup];
    }, []);    

    res.status(200).json(uniqueResults);

  }catch (err) {
    console.log(err);
  }
});

async function getUserDataWithSpecExp(userIDs: any): Promise<any> {
 
  try {
    const resultArr: any[] = [];

    for (let i = 0; i < userIDs.length; i++) {
      let userObj = {};
      let isUserExist = false;
      const userName = await getUserName(userIDs[i]);
      const userInfo = await UserInfo.findOne({userid: userIDs[i]}).exec();
      const certificateName = await getCertificateName(userIDs[i]);
      const specExp = await SpecExp.findOne({userid: userIDs[i]}).exec();
      const statusName = await getStatusName(userInfo?.statusid);
      const content = await getContent(userIDs[i]);

      if(userInfo) {
        isUserExist = true;
      }

      if(isUserExist){

        userObj = {
          'userid' : userIDs[i],
          'name' : userName,
          'hourlywages' : userInfo?.hourlywages,
          'jppassedlevel': userInfo?.jppassedlevel,
          'totalexp': specExp?.specexp,
          'techskill': userInfo?.techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        resultArr.push(userObj); 
      }

    }
    return resultArr;
  } catch (error) {
    console.error(error);
  }
}

async function getUserDataWithTotalExp(userIDs: any): Promise<any> {
 
  try {
    const resultArr: any[] = [];

    for (let i = 0; i < userIDs.length; i++) {
      let userObj = {};
      let isUserExist = false;
      const userName = await getUserName(userIDs[i]);
      const userInfo = await UserInfo.findOne({userid: userIDs[i]}).exec();
      const certificateName = await getCertificateName(userIDs[i]);
      const statusName = await getStatusName(userInfo?.statusid);
      const content = await getContent(userIDs[i]);

      if(userName) {
        isUserExist = true;
      }

      if(isUserExist){
        userObj = {
          'userid' : userIDs[i],
          'name' : userName,
          'hourlywages' : userInfo?.hourlywages,
          'jppassedlevel': userInfo?.jppassedlevel,
          'totalexp': userInfo?.totalexp,
          'techskill': userInfo?.techskill,
          'certificate_name' : certificateName,
          'status_name': statusName,
          'content': content
        };
        resultArr.push(userObj); 
      } 
    }
    return resultArr;
    
  } catch (error) {
    console.error(error);
  }
}

async function getCertificateName(userid: any): Promise<any> {
  try {
    const result = await Certification.aggregate([
      {
        $match: {
          "userid": userid
        }
      },
      {
        $group: {
          _id: "$userid",
          certifi_name: { $push: "$name" }
        }
      },
      {
        $project: {
          _id: 1,
          joinedValues: {
            $reduce: {
              input: "$certifi_name",
              initialValue: "",
              in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", ","] }, "$$this"] }
            }
          }
        }
      }
    ]).exec();
    if (result.length > 0) {
      return result[0].joinedValues;
    } 
  } catch (error) {
    console.error(error);
  }
}


async function getContent(userid: any): Promise<any> {
 
  try {
    const result = await SpecExp.aggregate([
    {
      $match: {
        "userid": userid
      }
    },
    {
      $project: {
        _id: 1,
        combinedValue: {
          $concat: ["$content", " - ", "$specexp"]
        }
      }
    },
    {
      $group: {
        _id: "$userid",
        content: { $push: "$combinedValue" }
      }
    },
  ]).exec();
  if (result.length > 0) {
    return result[0].content;
  }   
  } catch (error) {
    console.error(error);
  }
}

async function getStatusName(statusid: any): Promise<any> {
 
  try {
    const result = await Status.findOne({statusid: statusid}).select('statusname').exec();
    return result?.statusname;
  } catch (error) {
    console.error(error);
  }
}

async function getUserName(userid: any): Promise<any> {
 
  try {
    const result = await User.findOne({userid: userid,delflg: 0}).select('name').exec();
    return result?.name;
  } catch (error) {
    console.error(error);
  }
}

async function findUserExp(expOverNum: number, expUnderNum: number): Promise<any> {
  try {
    const result = await UserInfo.find({ delflg: 0 }).select('userid totalexp');

    const filteredResult = result.filter((user: any) => {

      if (user.totalexp) {
        const matches = user.totalexp.match(/(?:(\d+)年)?(?:(\d+)月)?/);
        if (matches && matches.length > 0) {
          const years = parseInt(matches[1] || "0");
          const months = parseInt(matches[2] || "0");
          const totalMonths = years * 12 + months;
      
          if (expOverNum !== 0 && expUnderNum !== 0) {
            return totalMonths >= expOverNum && totalMonths <= expUnderNum;
          }
          if (expOverNum !== 0 && expUnderNum === 0) {
            return totalMonths >= expOverNum;
          }
          if (expOverNum === 0 && expUnderNum !== 0) {
            return totalMonths <= expUnderNum;
          }
        }
      }
      
      return false;
    });

    return filteredResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function findUserExpWithUserIds(userIds: any, expOverNum:number, expUnderNum:number): Promise<any> {

  try {
    const result = await UserInfo.find({ userid: { $in: userIds },delflg: 0 }).select('userid totalexp');

    const filteredResult = result.filter((user: any) => {

      if (user.totalexp) {
        const matches = user.totalexp.match(/(?:(\d+)年)?(?:(\d+)月)?/);
        if (matches && matches.length > 0) {
          const years = parseInt(matches[1] || "0");
          const months = parseInt(matches[2] || "0");
          const totalMonths = years * 12 + months;
      
          if (expOverNum !== 0 && expUnderNum !== 0) {
            return totalMonths >= expOverNum && totalMonths <= expUnderNum;
          }
          if (expOverNum !== 0 && expUnderNum === 0) {
            return totalMonths >= expOverNum;
          }
          if (expOverNum === 0 && expUnderNum !== 0) {
            return totalMonths <= expUnderNum;
          }
        }
      }
      
      return false;
    });

    return filteredResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function findSpecExp(expOverNum:number, expUnderNum:number): Promise<any> {
  try {
    const result = await SpecExp.find({ delflg: 0 }).select('userid specexp');

    const filteredResult = result.filter((user: any) => {

      if (user.specexp) {
        const matches = user.specexp.match(/(?:(\d+)年)?(?:(\d+)月)?/);
        if (matches && matches.length > 0) {
          const years = parseInt(matches[1] || "0");
          const months = parseInt(matches[2] || "0");
          const totalMonths = years * 12 + months;
      
          if (expOverNum !== 0 && expUnderNum !== 0) {
            return totalMonths >= expOverNum && totalMonths <= expUnderNum;
          }
          if (expOverNum !== 0 && expUnderNum === 0) {
            return totalMonths >= expOverNum;
          }
          if (expOverNum === 0 && expUnderNum !== 0) {
            return totalMonths <= expUnderNum;
          }
        }
      }
      
      return false;
    });

    return filteredResult;
  } catch (error) {
    console.error(error);
    throw error;
  }

}

async function findSpecExpWithUserIds(userIds: any, expOverNum:number, expUnderNum:number): Promise<any> {
  try {
    const result = await SpecExp.find({userid: { $in: userIds }, delflg: 0 }).select('userid specexp');

    const filteredResult:any = result.filter((user: any) => {

      if (user.specexp) {
        const matches = user.specexp.match(/(?:(\d+)年)?(?:(\d+)月)?/);
        if (matches && matches.length > 0) {
          const years = parseInt(matches[1] || "0");
          const months = parseInt(matches[2] || "0");
          const totalMonths = years * 12 + months;
      
          if (expOverNum !== 0 && expUnderNum !== 0) {
            return totalMonths >= expOverNum && totalMonths <= expUnderNum;
          }
          if (expOverNum !== 0 && expUnderNum === 0) {
            return totalMonths >= expOverNum;
          }
          if (expOverNum === 0 && expUnderNum !== 0) {
            return totalMonths <= expUnderNum;
          }
        }
      }
      
      return false;
    });

    return filteredResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
 
}


export default router;