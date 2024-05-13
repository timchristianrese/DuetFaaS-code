import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { genetic } from "./genetic";

const n = 525_000;

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const mutation = genetic(n);

  return {
    statusCode: 200,
    body: JSON.stringify({
      mutation,
      n,
    }),
  };
};
