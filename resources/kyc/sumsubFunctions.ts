import { createHmac } from "crypto";
import { getMasterSumsubConfig } from "../db/dbFunctions";

export const generateAccessToken = async (userId: string, levelName = "basic-kyc-level") => {
  const sumsubConfig = await getMasterSumsubConfig();
  console.log(sumsubConfig);
  const endPoint = `/resources/accessTokens?ttlInSecs=600&userId=${userId}&levelName=${levelName}`;
  const url = `${sumsubConfig.baseurl}${endPoint}`;
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-App-Token": sumsubConfig.sumsub_app_token
    },
    url: endPoint,
    body: ""
  };
  await createSignature(options);
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
  const sumsubConfig = await getMasterSumsubConfig();
  const endPoint = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
  const url = `${sumsubConfig.baseUrl}${endPoint}`;
  const options = {
    url: endPoint,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-App-Token": sumsubConfig.sumsub_app_token
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
  const sumsubConfig = await getMasterSumsubConfig();
  const endPoint = `/resources/applicants/-;externalUserId=${userId}/one`;
  const url = `${sumsubConfig.baseUrl}${endPoint}`;
  const options = {
    url: endPoint,
    method: "GET",
    headers: {
      "content-type": "application/json",
      "X-App-Token": sumsubConfig.sumsub_app_token
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

async function createSignature(config: any) {
  const sumsubConfig = await getMasterSumsubConfig();
  var ts = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", sumsubConfig.sumsub_secret_key);
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