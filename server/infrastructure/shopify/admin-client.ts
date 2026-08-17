import { prisma } from '../database/client.js';

export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[] }>;
}

export class ShopifyAdminClient {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(shopDomain: string, accessToken: string, apiVersion = '2026-01') {
    if (!accessToken) {
      throw new Error('ShopifyAdminClient requires a valid access token.');
    }
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
  }

  /**
   * Execute authenticated GraphQL Admin query against Shopify
   */
  async graphql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(
      `https://${this.shopDomain}/admin/api/${this.apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const json = (await response.json()) as ShopifyGraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      throw new Error(`Shopify GraphQL Error: ${json.errors[0].message}`);
    }

    return json.data as T;
  }
}
