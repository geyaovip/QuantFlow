import { createHmac, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { loadAppConfig } from "../../../config/app-config.js";

type PlisioInvoiceInput = {
  amountUsd: string;
  email?: string;
  orderName: string;
  orderNumber: string;
};

type PlisioInvoiceResponse = {
  data?:
    | {
        expire_utc?: number;
        invoice_url?: string;
        txn_id?: string;
      }
    | string;
  message?: string;
  status?: string;
};

const COMPLETED_STATUSES = new Set(["completed"]);

@Injectable()
export class PlisioClient {
  private readonly config = loadAppConfig().payments;
  private readonly endpoint = "https://api.plisio.net/api/v1/invoices/new";

  assertEnabled() {
    if (!this.config.productionEnabled || !this.config.plisioApiKey) {
      throw new Error("plisio payment disabled");
    }
  }

  async createInvoice(input: PlisioInvoiceInput) {
    this.assertEnabled();

    const callbackUrl = `${this.config.publicApiUrl}/api/v1/membership/plisio/callback?json=true`;
    const successUrl = `${this.config.publicWebUrl}/app/membership?payment=success`;
    const failUrl = `${this.config.publicWebUrl}/app/membership?payment=failed`;
    const params = new URLSearchParams({
      allowed_psys_cids: this.config.allowedPsysCids.join(","),
      api_key: this.config.plisioApiKey,
      callback_url: callbackUrl,
      description: `${input.orderName}，仅开通会员容量。`,
      expire_min: "30",
      fail_callback_url: failUrl,
      fail_invoice_url: failUrl,
      json: "true",
      order_name: input.orderName,
      order_number: input.orderNumber,
      plugin: "QuantFlow",
      redirect_to_invoice: "false",
      source_amount: input.amountUsd,
      source_currency: this.config.sourceCurrency,
      success_callback_url: successUrl,
      success_invoice_url: successUrl,
      version: "1.0.0",
    });

    if (input.email) {
      params.set("email", input.email);
    }

    const response = await fetch(`${this.endpoint}?${params.toString()}`, {
      headers: {
        accept: "application/json",
        "user-agent": "QuantFlow/1.0 (+https://quantflow.chat)",
      },
      method: "GET",
    });
    const responseText = await response.text();
    const payload = parseJson(responseText);

    if (
      !response.ok ||
      payload?.status === "error" ||
      !payload?.data ||
      typeof payload.data === "string"
    ) {
      console.warn("Plisio invoice create failed", {
        httpStatus: response.status,
        providerStatus: payload?.status ?? null,
        providerError: compactProviderError(payload),
        rawResponse: responseText.slice(0, 300),
        allowedPsysCids: this.config.allowedPsysCids,
        sourceCurrency: this.config.sourceCurrency,
      });
      throw new Error("plisio invoice create failed");
    }

    const invoiceUrl = payload.data.invoice_url;
    const txnId = payload.data.txn_id;
    if (!invoiceUrl || !txnId) {
      throw new Error("plisio invoice response invalid");
    }

    return {
      expiresAt: payload.data.expire_utc
        ? new Date(payload.data.expire_utc * 1000)
        : null,
      invoiceUrl,
      rawPayload: payload,
      txnId,
    };
  }

  isCallbackSignatureValid(payload: Record<string, unknown>) {
    const verifyHash = payload.verify_hash;
    if (typeof verifyHash !== "string" || !verifyHash) {
      return false;
    }

    const withoutHash = { ...payload };
    delete withoutHash.verify_hash;

    return (
      this.compareDigest(this.compactJson(withoutHash), verifyHash) ||
      this.compareDigest(this.sortedCompactJson(withoutHash), verifyHash)
    );
  }

  normalizeCallback(payload: Record<string, unknown>) {
    const providerInvoiceId =
      readString(payload.txn_id) ?? readString(payload.id);
    const status = readString(payload.status);
    const orderNumber = readString(payload.order_number);

    return {
      isCompleted: status
        ? COMPLETED_STATUSES.has(status.toLowerCase())
        : false,
      orderNumber,
      providerInvoiceId,
      status,
    };
  }

  private compareDigest(input: string, expectedHex: string) {
    const digest = createHmac("sha1", this.config.plisioApiKey)
      .update(input)
      .digest("hex");
    const actual = Buffer.from(digest, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private compactJson(value: unknown) {
    return JSON.stringify(value);
  }

  private sortedCompactJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.sortedCompactJson(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>).sort(
        ([left], [right]) => left.localeCompare(right),
      );
      return `{${entries
        .map(
          ([key, item]) =>
            `${JSON.stringify(key)}:${this.sortedCompactJson(item)}`,
        )
        .join(",")}}`;
    }
    return JSON.stringify(value);
  }
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as PlisioInvoiceResponse;
  } catch {
    return null;
  }
}

function compactProviderError(payload: PlisioInvoiceResponse | null) {
  if (!payload) {
    return null;
  }
  const messageParts = [
    typeof payload.message === "string" ? payload.message : null,
    typeof payload.data === "string" ? payload.data : null,
  ].filter(Boolean);
  return messageParts.length
    ? messageParts.join(" | ").slice(0, 300)
    : JSON.stringify(payload.data ?? payload).slice(0, 300);
}

function readString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}
