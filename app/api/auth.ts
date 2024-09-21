import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

export function auth(req: NextRequest, modelProvider: ModelProvider) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  console.log(accessCode);
  console.log(apiKey);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();

  //利用存储的结果进行验证
  const query_result = query_account_by_key(accessCode);
  console.log("query_result");
  console.log(query_result);

  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());
  // 需要调用接口请求，邀请码是否正确

  //修改验证机制,需要判断密钥是否正确 key_num <-1
  if (
    serverConfig.needCode &&
    !serverConfig.codes.has(hashedCode) &&
    false &&
    !apiKey
  ) {
    console.log("进入 判断serverConfig");
    console.log(serverConfig);
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
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

    if (systemApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}

async function query_account_by_key(key: string) {
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
    return await response.json();
  } catch (error) {
    console.log("Request Failed", error);
  }

  console.log("调用结束1");

  // await fetch(fetchUrl, {
  //   method: "post",
  //   body: JSON.stringify(req_data),
  //   headers: headers,
  // })
  //   .then((res) => res.json())
  //   .then((res) => {
  //     // Set default model from env request
  //     // alert(res.data)
  //     console.log(res.data);
  //     key_num = res.data.key_num;
  //     user_type = res.data.user_type;
  //     console.log(key_num + "/" + user_type);

  //     this.setState({data: res.data})
  //     return res.data
  //   })
  //   .catch(() => {
  //     console.log("调用余额查询失败！");
  //     // return {"key_num":-1,"user_type":-1}
  //     return key_num
  //   })
}
