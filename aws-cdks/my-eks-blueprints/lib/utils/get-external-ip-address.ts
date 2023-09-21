import axios from "axios"

/**
 * Finds and returns my external IP address. 
 * If an error occurs while looking for an external IP address, 
 * the IP address of the 0.0.0.0/0 is returned instead.
 * 
 * @returns my external ip or 0.0.0.0
 */
export async function findMyExternalIp(): Promise<string> {
  const url = "https://ipecho.io/json";
  try {
    const response = await axios.get(url);
    console.log("axios response : "+ JSON.stringify(response.data.ip+"/32"));
    return response.data.ip+"/32"
  } catch(exception) {
    process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
    return "0.0.0.0/0";
  }
}