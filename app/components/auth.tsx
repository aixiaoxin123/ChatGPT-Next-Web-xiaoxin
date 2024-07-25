import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import { use, useEffect } from "react";
import { getClientConfig } from "../config/client";
import { json } from "stream/consumers";

function wrapPromise(promise: Promise<any>) {
  let status = "pending";
  let result: any;

  const suspender = promise.then(
    (resolve) => {
      status = "success";
      result = resolve;
    },
    (err) => {
      status = "error";
      result = err;
    },
  );

  return {
    read() {
      // 暴露一个read方法
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    },
  };
}

function query_account_by_key(key: string, accessStore: any, navigate: any) {
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

  fetch(fetchUrl, {
    method: "post",
    body: JSON.stringify(req_data),
    headers: headers,
  })
    .then((res) => res.json())
    .then((res) => {
      // Set default model from env request
      // alert(res.data)
      console.log(res.data);
      key_num = res.data.key_num;
      user_type = res.data.user_type;
      alert(key_num + "/" + user_type);

      if (key_num) {
        accessStore.key_num = key_num;
        accessStore.user_type = user_type;
        if (user_type === 0) {
          accessStore.user_type_name = "普通用户";
        } else if (user_type === 1) {
          accessStore.user_type_name = "黄金会员";
        } else if (user_type === 2) {
          accessStore.user_type_name = "铂金会员";
        } else {
          accessStore.user_type_name = "用户未登录";
        }
        console.log(accessStore.key_num);
        console.log(accessStore.user_type);
        alert("用户登录成功！");
        navigate(Path.Chat);
      } else {
        alert("邀请码错误，请关注公众号获取！");
        accessStore.key_num = -2;
        accessStore.user_type = -2;
        console.log(accessStore.key_num);
        console.log(accessStore.user_type);
      }
    })
    .catch(() => {
      alert("调用余额查询失败！");
      // return {"key_num":-1,"user_type":-1}
    })
    .finally(() => {
      // alert("结束")
    });
}
export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  // console.log("初始化"+accessStore.key_num)
  const goHome = () => navigate(Path.Home);
  const goChat = () => {
    let curr_accesscode = accessStore.accessCode;
    alert(curr_accesscode);

    accessStore.request_state = false;

    //进行查询邀请码，若错误则继续留在登录页面，若正确则访问主页；

    query_account_by_key(curr_accesscode, accessStore, navigate);
  };
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  }; // Reset access code to empty string

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles["auth-page"]}>
      {/* <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div> */}

      {/* 将下面的进行注释 */}
      {/* <div className={styles["auth-title"]}>
        <img
          width={200}
          src="https://file.aixiaoxin.cloud/image/aixiaoxin.png"
        />
      </div> */}

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <input
        className={styles["auth-input"]}
        // type="password"
        type="text"
        placeholder={Locale.Auth.Input}
        value={accessStore.accessCode}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.accessCode = e.currentTarget.value),
          );
        }}
      />
      {/* 如需办理会员，请联系客服：
            <div className={styles["auth-title"]}>
     <img width="100px" src="https://file.aixiaoxin.cloud/image/kefu.jpg"/>
      </div> */}

      {!accessStore.hideUserApiKey ? (
        <>
          <div className={styles["auth-tips"]}>{Locale.Auth.SubTips}</div>
          <input
            className={styles["auth-input"]}
            type="password"
            placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            value={accessStore.openaiApiKey}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.openaiApiKey = e.currentTarget.value),
              );
            }}
          />

          {/* 禁用google的apikey */}

          {/* <input
            className={styles["auth-input"]}
            type="password"
            placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
            value={accessStore.googleApiKey}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.googleApiKey = e.currentTarget.value),
              );
            }}
          /> */}
        </>
      ) : null}

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        <IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        />
      </div>

      {/* 将下面的进行注释 */}

      {/* <div
        style={{
          // backgroundColor: 'black',
          color: "pink",
          margin: 80,
        }}
      >
        <a
          color="rgb(202 103 103)"
          href="https://beian.miit.gov.cn/"
          target="_blank"
        >
          苏ICP备18002577号-2
        </a>
      </div> */}
    </div>
  );
}
