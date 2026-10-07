/**
 * Client-side wrappers for Maker Valuation server functions.
 * These call the server functions via createServerFn.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_createMakerValuation as db_create,
  api_getMakerValuation as db_get,
  api_downloadMakerValuationPdf as db_download,
} from "@/server/api.server";
import type { MakerValuation } from "@/types";

type CreateMakerValuationInput = {
  token: string | null;
  caseId: string;
  dateOfValuation: string;
  dateOfInspection: string;
  refNo: string;
  branch: string;
  bankName: string;
};

const createMakerValuationFn = createServerFn({ method: "POST" })
  .validator((input: CreateMakerValuationInput) => input)
  .handler(({ data }) =>
    db_create(
      data.token,
      data,
    ),
  );

const getMakerValuationFn = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(({ data }) => db_get(data));

const downloadMakerValuationPdfFn = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(({ data }) => db_download(data));

export function api_createMakerValuation(input: CreateMakerValuationInput): Promise<MakerValuation> {
  return createMakerValuationFn({ data: input });
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
