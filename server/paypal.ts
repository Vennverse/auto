// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

// Make PayPal optional - only initialize if credentials are provided
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.log("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not provided - PayPal features will be disabled");
} else {
  console.log("PayPal credentials found - initializing PayPal SDK");
  console.log(`Client ID: ${PAYPAL_CLIENT_ID.substring(0, 10)}...`);
  const isProduction = (PAYPAL_CLIENT_ID?.startsWith('A') && !PAYPAL_CLIENT_ID?.includes('sandbox')) || process.env.PAYPAL_ENVIRONMENT === "production";
  console.log(`Environment: ${isProduction ? "Production" : "Sandbox"}`);
}
// Initialize PayPal client only if credentials are available
let client: Client | null = null;
let ordersController: OrdersController | null = null;
let oAuthAuthorizationController: OAuthAuthorizationController | null = null;

if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment:
                  // Use production if credentials look like live credentials or if explicitly set
                  (PAYPAL_CLIENT_ID?.startsWith('A') && !PAYPAL_CLIENT_ID?.includes('sandbox')) || process.env.PAYPAL_ENVIRONMENT === "production"
                    ? Environment.Production
                    : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true,
      },
      logResponse: {
        logHeaders: true,
      },
    },
  });
  ordersController = new OrdersController(client);
  oAuthAuthorizationController = new OAuthAuthorizationController(client);
}

/* Token generation helpers */

export async function getClientToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !oAuthAuthorizationController) {
    throw new Error("PayPal not configured - missing credentials");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    if (!ordersController) {
      return res.status(503).json({ error: "PayPal not configured" });
    }

    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('invalid_client')) {
      console.error("PayPal authentication failed - credentials may be invalid for current environment");
      console.error("Current environment:", (PAYPAL_CLIENT_ID?.startsWith('A') && !PAYPAL_CLIENT_ID?.includes('sandbox')) || process.env.PAYPAL_ENVIRONMENT === "production" ? "Production" : "Sandbox");
      res.status(503).json({ 
        error: "PayPal payment system configuration issue. Please verify your credentials match the environment.",
        details: "Authentication failed - check if live credentials are being used with correct environment"
      });
    } else {
      res.status(500).json({ error: "Failed to create order." });
    }
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    if (!ordersController) {
      return res.status(503).json({ error: "PayPal not configured" });
    }

    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: "PayPal not configured" });
    }

    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("Failed to load PayPal default:", error);
    res.status(500).json({ error: "Failed to load PayPal configuration" });
  }
}
// <END_EXACT_CODE>