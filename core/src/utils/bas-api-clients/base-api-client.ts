import axios, { AxiosResponse } from "axios";

export enum loginType {
  Basic = "basic",
  Body = "body",
}

export class BaseAPIClient {
  protected token: string | null = null;
  protected tokenExpiration: Date | null = null;

  constructor(
    private baseUri: string,
    private getTokenPath: string,
    private username: string,
    private password: string,
    private expirationMinutes: number = 60,
    private authType: loginType = loginType.Body,
    private tokenKey: string = "token"
  ) {}

  // Method to get a new token for apis
  protected async getToken(): Promise<void> {
    try {
      let response: AxiosResponse;

      if (this.authType === loginType.Basic) {
        const authHeader =
          "Basic " +
          Buffer.from(`${this.username}:${this.password}`).toString("base64");

        response = await axios.post(
          `${this.baseUri}${this.getTokenPath}`,
          {},
          {
            headers: {
              Authorization: authHeader,
            },
          }
        );
      } else {
        response = await axios.post(`${this.baseUri}${this.getTokenPath}`, {
          username: this.username,
          pass: this.password,
        });
      }

      this.token = response.data[this.tokenKey];

      // Set token expiration (assume token lasts for 1 hour)
      this.tokenExpiration = new Date();
      this.tokenExpiration.setMinutes(
        this.tokenExpiration.getMinutes() + this.expirationMinutes
      );

      console.log("New token acquired:", this.token);
    } catch (error) {
      console.error("Error getting token:", error);
      throw new Error("Failed to get token");
    }
  }

  // Method to check if the token is valid
  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiration) {
      return false;
    }
    return new Date() < this.tokenExpiration;
  }

  // Method to post data to any API with token authorization, with retry logic
  public async post(path: string, data: any): Promise<AxiosResponse<any>> {
    // Ensure token is valid
    if (!this.isTokenValid()) {
      await this.getToken();
    }

    try {
      // First API request attempt
      const response = await this.makeApiRequest(path, data);
      return response;
    } catch (error: any) {
      // If we receive a 401, re-fetch the token and retry the request
      if (error.response && error.response.status === 401) {
        console.log("Received 401 Unauthorized, fetching new token...");

        await this.getToken(); // Get a new token
        try {
          // Retry the API request with the new token
          const retryResponse = await this.makeApiRequest(path, data);
          return retryResponse;
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          throw retryError;
        }
      }

      // If any other error occurred, throw it
      console.error("Error making API request:", error);
      throw error;
    }
  }

  // Helper method to make the actual API request
  private async makeApiRequest(
    path: string,
    data: any
  ): Promise<AxiosResponse<any>> {
    return await axios.post(`${this.baseUri}${path}`, data, {
      headers: { Authorization: `Bearer ${this.token}` },
      maxBodyLength: Infinity,
    });
  }
}
