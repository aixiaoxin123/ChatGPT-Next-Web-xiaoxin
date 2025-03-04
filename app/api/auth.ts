import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";
import { ensure } from "../utils/clone";

let result_data = { key_num: -1, user_type: -1 };

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

export function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

export async function auth(req: NextRequest, modelProvider: ModelProvider) {
  const authToken = req.headers.get("Authorization") ?? "";
  // console.log(req)
  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  // console.log("accessCode:"+accessCode);
  // console.log("apiKey:"+apiKey);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();

  //利用存储的结果进行验证
  // let query_result
  // query_result= "进入api调用之前";
  // console.log("apiKey: "+apiKey)
  console.log("进入api调用之前");
  const query_result = await query_account_by_key(accessCode);
  console.log(query_result);
  // query_account_by_key(accessCode)

  console.log("结束api调用,输出result_data");
  // query_result= "123";
  // console.log(result_data)

  // console.log("结束 query_account_by_key")
  // console.log("获取 query_result");
  // console.log(query_result);

  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());
  // 需要调用接口请求，邀请码是否正确

  //修改验证机制,需要判断密钥是否正确 key_num <-1
  // if (
  //   serverConfig.needCode &&
  //   !serverConfig.codes.has(hashedCode) &&
  //   !apiKey
  // ) {
  //   console.log("进入 判断serverConfig");
  //   console.log(serverConfig);
  //   return {
  //     error: true,
  //     msg: !accessCode ? "empty access code" : "wrong access code",
  //   };
  // }

  // console.log(result_data.key_num)
  // console.log(result_data.user_type)
  if (result_data && !apiKey) {
    // let key_num = result_data.key_num;
    // let user_type = result_data.user_type;
    console.log("进入调用次数的判断");
    if (result_data.key_num < 1) {
      // console.log("进入 判断serverConfig");
      // console.log(serverConfig);
      return {
        error: true,
        msg: "账户余额不足!",
      };
    } else {
      console.log("账户余额大于0，可以进行访问");
    }
  } else if (apiKey) {
    console.log("利用用户的apikey，未进入调用次数的判断");
  } else {
    return {
      error: true,
      msg: "网络连接失败或者访问密码错误,请重新输入邀请码！",
    };
  }

  // if (serverConfig.hideUserApiKey && !!apiKey) {
  //   return {
  //     error: true,
  //     msg: "you are not allowed to access with your own api key",
  //   };
  // }

  // console.log(req.headers)
  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    console.log("进入apikey的判断");
    const serverConfig = getServerSideConfig();

    // const systemApiKey =
    //   modelProvider === ModelProvider.GeminiPro
    //     ? serverConfig.googleApiKey
    //     : serverConfig.isAzure
    //     ? serverConfig.azureApiKey
    //     : serverConfig.apiKey;

    let systemApiKey: string | undefined;

    switch (modelProvider) {
      case ModelProvider.GeminiPro:
        systemApiKey = serverConfig.googleApiKey;
        break;
      case ModelProvider.Claude:
        systemApiKey = serverConfig.anthropicApiKey;
        break;
      case ModelProvider.Doubao:
        systemApiKey = serverConfig.bytedanceApiKey;
        break;
      case ModelProvider.Ernie:
        systemApiKey = serverConfig.baiduApiKey;
        break;
      case ModelProvider.Qwen:
        systemApiKey = serverConfig.alibabaApiKey;
        break;
      case ModelProvider.GPT:
      default:
        if (req.nextUrl.pathname.includes("azure/deployments")) {
          systemApiKey = serverConfig.azureApiKey;
        } else {
          systemApiKey = serverConfig.apiKey;
        }
    }
    // console.log("modelProvider:"+modelProvider)
    // console.log("systemApiKey:"+systemApiKey)

    if (systemApiKey) {
      // console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("给用户的apikey进行赋值");
    req.headers.set("Authorization", `Bearer ${apiKey}`);
    console.log("[Auth] use user api key:" + apiKey);
  }
  return {
    error: false,
  };
}

export async function query_account_by_key(key: string) {
  // let accessStore =useAccessStore;

  var path = "/api/mysql/query_secret_key";

  var baseUrl = "https://www.aixiaoxin.cloud";

  var req_data = { secret_key: key };

  var fetchUrl = baseUrl + path;
  var headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  var key_num = -1;
  var user_type = -1;

  try {
    let response = await fetch(fetchUrl, {
      method: "post",
      body: JSON.stringify(req_data),
      headers: headers,
    });
    let data = await response.json();
    // console.log(data)
    let retCode = data.retCode;
    if (retCode == 0) {
      result_data = data.data;
    } else {
      result_data = { key_num: -1, user_type: -1 };
    }

    // console.log(result_data)

    return result_data;
  } catch (error) {
    console.log("Request Failed", error);
    result_data = { key_num: -1, user_type: -1 };
    return result_data;
  }
}

export async function update_key_num(key: string, step_num = 1) {
  // let accessStore =useAccessStore;

  // let step_num
  // if (modelVersion.includes('gpt-4') || modelVersion.includes('gpt4'))
  //   step_num = 5

  // else
  //   step_num = 1

  var path = "/api/mysql/sub_key_num";
  // const url = 'https://www.aixiaoxin.cloud/api/mysql/sub_key_num'
  var baseUrl = "https://www.aixiaoxin.cloud";

  var req_data = { secret_key: key, sub_setp: step_num };
  let req_result = true;
  var fetchUrl = baseUrl + path;
  var headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    let response = await fetch(fetchUrl, {
      method: "post",
      body: JSON.stringify(req_data),
      headers: headers,
    });
    let data = await response.json();
    // console.log(data)
    let retCode = data.retCode;
    if (retCode == 0) {
      req_result = true;
    } else {
      req_result = false;
    }
    return req_result;
  } catch (error) {
    console.log("Request Failed", error);
    req_result = false;
    return req_result;
  }
}

export async function judge_question(key: string, step_num = 1) {
  // let accessStore =useAccessStore;

  // let step_num
  // if (modelVersion.includes('gpt-4') || modelVersion.includes('gpt4'))
  //   step_num = 5

  // else
  //   step_num = 1

  var path = "/api/mysql/sub_key_num";
  // const url = 'https://www.aixiaoxin.cloud/api/mysql/sub_key_num'
  var baseUrl = "https://www.aixiaoxin.cloud";

  var req_data = { secret_key: key, sub_setp: step_num };
  let req_result = true;
  var fetchUrl = baseUrl + path;
  var headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    let response = await fetch(fetchUrl, {
      method: "post",
      body: JSON.stringify(req_data),
      headers: headers,
    });
    let data = await response.json();
    // console.log(data)
    let retCode = data.retCode;
    if (retCode == 0) {
      req_result = true;
    } else {
      req_result = false;
    }
    return req_result;
  } catch (error) {
    console.log("Request Failed", error);
    req_result = false;
    return req_result;
  }
}

export async function save_question(key: string, step_num = 1) {
  // let accessStore =useAccessStore;

  // let step_num
  // if (modelVersion.includes('gpt-4') || modelVersion.includes('gpt4'))
  //   step_num = 5

  // else
  //   step_num = 1

  var path = "/api/mysql/sub_key_num";
  // const url = 'https://www.aixiaoxin.cloud/api/mysql/sub_key_num'
  var baseUrl = "https://www.aixiaoxin.cloud";

  var req_data = { secret_key: key, sub_setp: step_num };
  let req_result = true;
  var fetchUrl = baseUrl + path;
  var headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    let response = await fetch(fetchUrl, {
      method: "post",
      body: JSON.stringify(req_data),
      headers: headers,
    });
    let data = await response.json();
    // console.log(data)
    let retCode = data.retCode;
    if (retCode == 0) {
      req_result = true;
    } else {
      req_result = false;
    }
    return req_result;
  } catch (error) {
    console.log("Request Failed", error);
    req_result = false;
    return req_result;
  }
}
