/**
 * Client-side wrappers for Maker Valuation server functions.
 * These call the server functions via createServerFn.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_createMakerValuation as db_create,
  api_getMakerValuation as db_get,
  api_downloadMakerValuationPdf as db_download,
  api_downloadMakerValuationReport as db_downloadReport,
} from "@/server/api.server";
import { getSessionToken } from "@/lib/auth-client";
import type { MakerValuation } from "@/types";
import type { CreateMakerValuationInput } from "@/schemas/makerValuation.schema";

interface CreateMakerValuationFnInput {
  token: string | null | undefined;
  data: CreateMakerValuationInput;
}

const createMakerValuationFn = createServerFn({ method: "POST" })
  .validator((input: CreateMakerValuationFnInput) => input)
  .handler(({ data }) => {
    return db_create(data.token, data.data);
  });

const getMakerValuationFn = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(({ data }) => db_get(data));

const downloadMakerValuationPdfFn = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(({ data }) => db_download(data));

const downloadMakerValuationReportFn = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(({ data }) => db_downloadReport(data));

export async function api_createMakerValuation(
  input: CreateMakerValuationInput,
): Promise<MakerValuation> {
  const token = await getSessionToken();
  return createMakerValuationFn({ data: { token, data: input } });
}

export function api_getMakerValuation(caseId: string): Promise<MakerValuation | null> {
  return getMakerValuationFn({ data: caseId });
}

export function api_downloadMakerValuationPdf(caseId: string): Promise<{
  filename: string;
  pdfBase64: string;
}> {
  return downloadMakerValuationPdfFn({ data: caseId });
}

export function api_downloadMakerValuationReport(caseId: string): Promise<{
  templateId: string;
  pdfFilename: string;
  pdfBase64: string;
  docxFilename: string;
  docxBase64: string;
}> {
  return downloadMakerValuationReportFn({ data: caseId });
}
