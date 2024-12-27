export const fetchProfileData = async (client: any, payload: any) => {
  const result = await client.post("/api/ebazaar/getdataprofile", payload);
  return result.data.data || [];
};

export const filterResponseData = (
  responseData: any[],
  businessType: string
) => {
  return responseData.filter((item: any) => item.businesstype === businessType);
};
