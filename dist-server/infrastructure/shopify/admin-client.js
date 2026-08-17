export class ShopifyAdminClient {
    shopDomain;
    accessToken;
    apiVersion;
    constructor(shopDomain, accessToken, apiVersion = '2026-01') {
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
    async graphql(query, variables = {}) {
        const response = await fetch(`https://${this.shopDomain}/admin/api/${this.apiVersion}/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': this.accessToken,
            },
            body: JSON.stringify({ query, variables }),
        });
        const json = (await response.json());
        if (json.errors && json.errors.length > 0) {
            throw new Error(`Shopify GraphQL Error: ${json.errors[0].message}`);
        }
        return json.data;
    }
}
