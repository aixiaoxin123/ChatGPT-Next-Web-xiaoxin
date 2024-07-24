import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import { useEffect } from "react";
import { getClientConfig } from "../config/client";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
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
      <div className={styles["auth-title"]}>
        <img
          width={200}
          src="https://file.aixiaoxin.cloud/image/aixiaoxin.png"
        />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <input
        className={styles["auth-input"]}
        type="password"
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

      <div
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
      </div>
    </div>
  );
}
