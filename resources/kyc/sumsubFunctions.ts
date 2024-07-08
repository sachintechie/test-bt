import { createHmac } from "crypto";

const baseUrl = "https://api.sumsub.com";
const SUMSUB_APP_TOKEN = "sbx:BF1tANJmWRFzd70TkFUYV7Te.dAqhytbg5I5ogufa9A9jd7oQWBEbnex6";
const SUMSUB_SECRET_KEY = "immowt8JzXcczhLMTyFFCz3FrU899EH3";

export const generateAccessToken = async (userId: string, levelName = "basic-kyc-level") => {
  const endPoint = `/resources/accessTokens?ttlInSecs=600&userId=${userId}&levelName=${levelName}`;
  const url = `${baseUrl}${endPoint}`;
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-App-Token": SUMSUB_APP_TOKEN
    },
    url: endPoint,
    body: ""
  };
  createSignature(options);
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (error) {
    // console.log(error);
    throw "error in getting access token";
  }
};
export const createApplicant = async (userId: string, levelName = "basic-kyc-level") => {
  const endPoint = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
  const url = `${baseUrl}${endPoint}`;
  const options = {
    url: endPoint,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-App-Token": SUMSUB_APP_TOKEN
    },
    body: JSON.stringify({ externalUserId: userId })
  };
  createSignature(options);
  // console.log(options);
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    throw "error in creating applicant";
  }
};
export const getApplicantDataByExternalId = async (userId: string) => {
  const endPoint = `/resources/applicants/-;externalUserId=${userId}/one`;
  const url = `${baseUrl}${endPoint}`;
  const options = {
    url: endPoint,
    method: "GET",
    headers: {
      "content-type": "application/json",
      "X-App-Token": SUMSUB_APP_TOKEN
    }
  };
  createSignature(options);
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (error) {
     console.log(error);
    throw "error in getting applicant data";
  }
};

export const sumsubWebhookListener = async (event: any) => {
  try {
    console.log(event);
    return {
      status: 200,
      data: event,
      error: null
    };
  } catch (err) {
    throw "error in webhook listener";
  }
};

function createSignature(config: any) {
  var ts = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", SUMSUB_SECRET_KEY);
  signature.update(ts + config.method.toUpperCase() + config.url);

  if (config.body instanceof FormData) {
    signature.update(config.body.getBuffer());
  } else if (config.body) {
    signature.update(config.body);
  }
  config.headers["X-App-Access-Ts"] = ts.toString();
  config.headers["X-App-Access-Sig"] = signature.digest("hex");

  return config;
}