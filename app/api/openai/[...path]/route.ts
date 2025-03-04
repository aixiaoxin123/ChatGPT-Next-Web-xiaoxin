import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { ModelProvider, OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import {
  auth,
  query_account_by_key,
  parseApiKey,
  update_key_num,
} from "../../auth";
import { requestOpenai } from "../../common";

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter(
      (m) => !m.id.startsWith("gpt-4"),
    );
  }

  return remoteModelRes;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  if (!ALLOWD_PATH.has(subpath)) {
    console.log("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }
  const authToken = req.headers.get("Authorization") ?? "";

  const responseClone = req.clone();

  // First read
  let model_type = "";
  await responseClone.json().then((data) => {
    console.log(data);
    model_type = data.model;
  });

  console.log("model_type :" + model_type);
  const model_type_dict = {
    "gpt-4o-mini": 1,
    "deepseek-chat": 1,
    "deepseek-coder": 1,
    "deepseek-r1": 1,
    "grok-3": 5,
    "grok-3-reasoner": 10,
    "grok-3-deepsearch": 10,
  };
  // console.log("req.body :"+body.get(""))

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  const authResult = await auth(req, ModelProvider.GPT);
  console.log("authResult");
  // console.log(authResult)
  if (authResult.error) {
    console.log("调用失败");
    return NextResponse.json(authResult, {
      status: 401,
    });
  } else {
    console.log("调用成功!");
    //需要进行扣费
    if (!apiKey) {
      let step_num = 1;
      // 获取所有键值对
      switch (model_type) {
        case "gpt-4o-mini":
          step_num = 1;
          break;
        case "deepseek-chat":
          step_num = 1;
          break;
        case "deepseek-coder":
          step_num = 1;
          break;
        case "deepseek-r1":
          step_num = 1;
          break;
        case "grok-3":
          step_num = 3;
          break;
        case "grok-3-reasoner":
          step_num = 6;
          break;
        case "grok-3-deepsearch":
          step_num = 6;
          break;
      }
      // console.log(step_num,"11111")
      const query_result = await update_key_num(accessCode, step_num);
      console.log("减少问答次数-调用成功 query_result :" + query_result);

      try {
        const response = await requestOpenai(req);
        console.log("response");
        console.log(response);
        console.log(response.status);
        // list models
        if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
          const resJson = (await response.json()) as OpenAIListModelResponse;
          const availableModels = getModels(resJson);
          return NextResponse.json(availableModels, {
            status: response.status,
          });
        } else if (response.status === 401 || response.status === 503) {
          //需要进行扣费
          if (!apiKey) {
            const query_result = await update_key_num(accessCode, -step_num);
            console.log("增加问答次数 query_result :" + query_result);
          }
        }

        return response;
      } catch (e) {
        console.log("调用失败，response eror");
        console.error("[OpenAI] ", e);
        // let step_num = -1;

        const query_result = await update_key_num(accessCode, -step_num);
        console.log("增加问答次数 query_result :" + query_result);

        return NextResponse.json(prettyObject(e));
      }
    }
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
export const preferredRegion = [
  "arn1",
  "bom1",
  "cdg1",
  "cle1",
  "cpt1",
  "dub1",
  "fra1",
  "gru1",
  "hnd1",
  "iad1",
  "icn1",
  "kix1",
  "lhr1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
];
