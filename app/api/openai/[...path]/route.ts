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

  // const body = await req.json()
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
    let step_num = 1;
    const query_result = await update_key_num(accessCode, step_num);
    console.log("减少问答次数-调用成功 query_result :" + query_result);
  }

  try {
    const response = await requestOpenai(req);
    console.log("response");
    // console.log(response)
    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    } else if (response.status === 401) {
      let step_num = -1;
      const query_result = await update_key_num(accessCode, step_num);
      console.log("增加问答次数 query_result :" + query_result);
    }

    return response;
  } catch (e) {
    console.log("response eror");
    console.error("[OpenAI] ", e);
    let step_num = -1;
    const query_result = await update_key_num(accessCode, step_num);
    console.log("增加问答次数 query_result :" + query_result);

    return NextResponse.json(prettyObject(e));
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
